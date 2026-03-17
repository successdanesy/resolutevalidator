import 'dotenv/config.js';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import CryptoJS from "crypto-js";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://bankvalidatordemo.vercel.app',
    'https://bankvalidatorinternal.vercel.app',
    'https://resolutevalidator.vercel.app',
    'https://bank-validator-backend.onrender.com',
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));

// ====== Supabase Client ======
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ====== Remita Credentials (from environment variables) ======
const merchantId = process.env.REMITA_MERCHANT_ID;
const apiKey = process.env.REMITA_API_KEY;
const apiToken = process.env.REMITA_API_TOKEN;
const baseUrl = "https://login.remita.net/remita/exapp/api/v1/send/api";
const aesKey = process.env.REMITA_AES_KEY;
const aesIv = process.env.REMITA_AES_IV;

// Fail fast if any required environment variable is missing
const requiredEnvVars = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    REMITA_MERCHANT_ID: merchantId,
    REMITA_API_KEY: apiKey,
    REMITA_API_TOKEN: apiToken,
    REMITA_AES_KEY: aesKey,
    REMITA_AES_IV: aesIv,
    BATCH_PIN: process.env.BATCH_PIN,
};
const missingVars = Object.entries(requiredEnvVars).filter(([, v]) => !v).map(([k]) => k);
if (missingVars.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n  ${missingVars.join('\n  ')}\n\nCopy .env.example to .env and fill in the values.\n`);
    process.exit(1);
}


// ====== Track active jobs for cancellation ======
const activeJobs = new Map(); // jobId -> { shouldCancel: boolean }

// ====== Helpers ======
function padAccountNo(accountNo) {
    const acct = accountNo.toString();
    return acct.padStart(10, "0");
}

function padBankCode(bankCode) {
    return bankCode.length === 2 ? "0" + bankCode : bankCode;
}

function AES_128_ENCRYPT(rawData) {
    const key = CryptoJS.enc.Utf8.parse(aesKey);
    const iv = CryptoJS.enc.Utf8.parse(aesIv);
    return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(rawData), key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();
}

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Bank Validator API is running",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

// ====== Single account validation route ======
app.post("/api/validate-account", async (req, res) => {
    try {
        let { accountNo, bankCode } = req.body;

        accountNo = padAccountNo(accountNo);
        bankCode = padBankCode(bankCode);

        const encryptedAccountNo = AES_128_ENCRYPT(accountNo);
        const encryptedBankCode = AES_128_ENCRYPT(bankCode);

        const requestId = Date.now().toString();
        const apiHash = CryptoJS.SHA512(apiKey + requestId + apiToken).toString();

        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const seconds = d.getUTCSeconds();
        const timeStamp = `${yyyy}-${mm}-${dd}T${hours}:${minutes}:${seconds}+000000`;

        const headers = {
            "Content-Type": "application/json",
            MERCHANT_ID: merchantId,
            API_KEY: apiKey,
            REQUEST_ID: requestId,
            REQUEST_TS: timeStamp,
            API_DETAILS_HASH: apiHash,
        };

        const body = {
            accountNo: encryptedAccountNo,
            bankCode: encryptedBankCode,
        };

        const response = await fetch(
            `${baseUrl}/rpgsvc/rpg/api/v2/merc/fi/account/lookup`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();

        const accountName = data?.data?.accountName || "";
        const isValid = accountName && accountName.trim() !== "";

        res.json({
            accountNo,
            bankCode,
            accountName,
            response: isValid
                ? data?.data?.responseDescription || "Success"
                : "Invalid account details",
        });
    } catch (error) {
        res.status(500).json({ error: "Validation failed", details: error.message });
    }
});

// ====== Verify PIN route ======
app.post("/api/verify-pin", (req, res) => {
    const { pin } = req.body;
    const serverPin = process.env.BATCH_PIN ? process.env.BATCH_PIN.trim() : "";
    const clientPin = pin ? pin.toString().trim() : "";

    console.log(`[AUTH] PIN verification attempt: Client[${clientPin}] server[${serverPin}]`);

    if (clientPin === serverPin && serverPin !== "") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: "Invalid PIN" });
    }
});

// ====== Batch account validation route (async job creation) ======
app.post("/api/validate-batch", async (req, res) => {
    try {
        const { rows, pin } = req.body;
        
        if (pin !== process.env.BATCH_PIN) {
            return res.status(401).json({ error: "Invalid PIN. Batch processing is protected." });
        }

        if (!Array.isArray(rows)) {
            return res.status(400).json({ error: "Invalid payload. Expected array in 'rows'." });
        }

        // Create job in database
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
                status: 'pending',
                total_records: rows.length,
                processed_count: 0,
                failed_count: 0
            })
            .select()
            .single();

        if (jobError) throw jobError;

        // Track this job as active (not cancelled)
        activeJobs.set(job.id, { shouldCancel: false });

        // Start background processing (don't await)
        processJobInBackground(job.id, rows).catch(err =>
            console.error(`Error processing job ${job.id}:`, err)
        ).finally(() => {
            activeJobs.delete(job.id); // Clean up when done
        });

        res.json({ jobId: job.id });
    } catch (err) {
        console.error("Batch creation error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// ====== Get job status ======
app.get("/api/jobs/:jobId", async (req, res) => {
    try {
        const { jobId } = req.params;

        const { data: job, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .maybeSingle();

        if (error) throw error;
        if (!job) return res.status(404).json({ error: "Job not found" });

        res.json(job);
    } catch (err) {
        console.error("Job status error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// ====== Cancel job ======
app.post("/api/jobs/:jobId/cancel", async (req, res) => {
    try {
        const { jobId } = req.params;

        // Mark job as cancelled in database
        const { data: job, error } = await supabase
            .from('jobs')
            .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .eq('status', 'processing') // Only cancel if still processing
            .select()
            .single();

        if (error) throw error;
        if (!job) {
            // Job might be completed or not found
            return res.status(400).json({ 
                error: "Cannot cancel job - it may be completed or not found" 
            });
        }

        // Signal to background worker to stop
        if (activeJobs.has(jobId)) {
            activeJobs.get(jobId).shouldCancel = true;
        }

        console.log(`Job ${jobId} cancelled by user`);
        res.json({ message: "Job cancelled successfully", job });
    } catch (err) {
        console.error("Cancel job error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// ====== Get job results (paginated, in original CSV order) ======
app.get("/api/jobs/:jobId/results", async (req, res) => {
    try {
        const { jobId } = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 100;

        const { data: results, error } = await supabase
            .from('validation_results')
            .select('*')
            .eq('job_id', jobId)
            .order('sequence_number', { ascending: true })  // ✅ PRESERVE CSV ORDER
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json(results);
    } catch (err) {
        console.error("Results fetch error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// ====== Background worker for job processing ======
async function processJobInBackground(jobId, records) {
    try {
        // Update job status to processing
        await supabase
            .from('jobs')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', jobId);

        const CHUNK_SIZE = 50;
        const DELAY_BETWEEN_CHUNKS_MS = 500;
        let processedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            // CHECK FOR CANCELLATION
            if (activeJobs.has(jobId) && activeJobs.get(jobId).shouldCancel) {
                console.log(`Job ${jobId} cancelled, stopping processing`);
                return; // Exit early
            }

            const chunk = records.slice(i, i + CHUNK_SIZE);

            // Process chunk with concurrency limit (10 concurrent per chunk for better rate limiting)
            const CONCURRENT_LIMIT = 10;
            const results = [];

            for (let j = 0; j < chunk.length; j += CONCURRENT_LIMIT) {
                // CHECK FOR CANCELLATION again (inner loop)
                if (activeJobs.has(jobId) && activeJobs.get(jobId).shouldCancel) {
                    console.log(`Job ${jobId} cancelled mid-chunk, stopping processing`);
                    return;
                }

                const subChunk = chunk.slice(j, j + CONCURRENT_LIMIT);
                const subResults = await Promise.allSettled(
                    subChunk.map(r => validateSingleAccount(r.accountNo, r.bankCode))
                );
                results.push(...subResults);

                if (j + CONCURRENT_LIMIT < chunk.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Format and prepare results for bulk insert
            const bulkResults = [];
            results.forEach((result, idx) => {
                const record = chunk[idx];
                const sequenceNumber = i + idx; // ✅ TRACK ORIGINAL CSV POSITION
                
                if (result.status === 'fulfilled') {
                    const validationResult = result.value;
                    bulkResults.push({
                        job_id: jobId,
                        sequence_number: sequenceNumber,  // ✅ ADDED
                        account_no: validationResult.accountNo,
                        bank_code: validationResult.bankCode,
                        account_name: validationResult.accountName || '',
                        validation_status: validationResult.accountName ? 'success' : 'invalid',
                        error_message: !validationResult.accountName ? validationResult.response : null
                    });
                    processedCount++;
                } else {
                    bulkResults.push({
                        job_id: jobId,
                        sequence_number: sequenceNumber,  // ✅ ADDED
                        account_no: record.accountNo,
                        bank_code: record.bankCode,
                        account_name: '',
                        validation_status: 'error',
                        error_message: result.reason?.message || 'Validation failed'
                    });
                    processedCount++;
                    failedCount++;
                }
            });

            // Bulk insert results
            if (bulkResults.length > 0) {
                const { error: insertError } = await supabase
                    .from('validation_results')
                    .insert(bulkResults);

                if (insertError) {
                    console.error('Error inserting results:', insertError);
                    failedCount += bulkResults.length;
                }
            }

            // Update job progress
            await supabase
                .from('jobs')
                .update({
                    processed_count: processedCount,
                    failed_count: failedCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            console.log(`Job ${jobId}: Processed ${processedCount}/${records.length}`);

            // Add delay between chunks to respect API rate limits
            if (i + CHUNK_SIZE < records.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS));
            }
        }

        // Mark job as completed (only if not cancelled)
        if (!activeJobs.has(jobId) || !activeJobs.get(jobId).shouldCancel) {
            await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            console.log(`Job ${jobId}: Completed successfully`);
        }
    } catch (err) {
        console.error(`Job ${jobId} failed:`, err);
        await supabase
            .from('jobs')
            .update({
                status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
    }
}

// NEW: Extract single account validation logic
async function validateSingleAccount(accountNo, bankCode) {
    try {
        accountNo = padAccountNo(accountNo);
        bankCode = padBankCode(bankCode);

        const encryptedAccountNo = AES_128_ENCRYPT(accountNo);
        const encryptedBankCode = AES_128_ENCRYPT(bankCode);

        const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const apiHash = CryptoJS.SHA512(apiKey + requestId + apiToken).toString();

        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const seconds = d.getUTCSeconds();
        const timeStamp = `${yyyy}-${mm}-${dd}T${hours}:${minutes}:${seconds}+000000`;

        const headers = {
            "Content-Type": "application/json",
            MERCHANT_ID: merchantId,
            API_KEY: apiKey,
            REQUEST_ID: requestId,
            REQUEST_TS: timeStamp,
            API_DETAILS_HASH: apiHash,
        };

        const body = {
            accountNo: encryptedAccountNo,
            bankCode: encryptedBankCode,
        };

        const response = await fetch(
            `${baseUrl}/rpgsvc/rpg/api/v2/merc/fi/account/lookup`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();
        const accountName = data?.data?.accountName || "";
        const responseText = accountName ?
            (data?.data?.responseDescription || "Success") :
            "Invalid account details";

        return {
            accountNo,
            bankCode,
            accountName,
            response: responseText,
        };
    } catch (err) {
        console.error(`Error validating ${accountNo}:`, err.message);
        return {
            accountNo: accountNo || "",
            bankCode: bankCode || "",
            accountName: "",
            response: "API Error",
        };
    }
}

// ====== Start Server ======
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});