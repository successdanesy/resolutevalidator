import CryptoJS from "crypto-js";
import fetch from "node-fetch";

// ====== Remita Credentials (keep secret) ======
const merchantId = process.env.REMITA_MERCHANT_ID;
const apiKey = process.env.REMITA_API_KEY;
const apiToken = process.env.REMITA_API_TOKEN;
const aesKey = process.env.REMITA_AES_KEY;
const aesIv = process.env.REMITA_AES_IV;
const baseUrl = "https://login.remita.net/remita/exapp/api/v1/send/api";

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

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rows = req.body;

        if (!Array.isArray(rows)) {
            return res.status(400).json({ error: "Invalid payload. Expected array." });
        }

        const results = [];

        for (let row of rows) {
            let { accountNo, bankCode } = row;

            // Check for missing values
            if (!accountNo || !bankCode) {
                results.push({
                    accountNo: accountNo || "",
                    bankCode: bankCode || "",
                    accountName: "",
                    response: "Invalid account details",
                });
                continue;
            }

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

            try {
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
                const responseText = accountName ? data?.data?.responseDescription : "Invalid account details";

                results.push({
                    accountNo,
                    bankCode,
                    accountName,
                    response: responseText,
                });
            } catch (err) {
                results.push({
                    accountNo,
                    bankCode,
                    accountName: "",
                    response: "Error contacting API",
                });
            }
        }

        return res.json(results);
    } catch (err) {
        console.error("Batch error:", err);
        return res.status(500).json({ error: "Server error", details: err.message });
    }
}