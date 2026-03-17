#!/usr/bin/env node
/**
 * Bank Account Validator - High-Performance CLI alternative to the GUI setup hosted on Vercel + Render
 * 
 * WHY THIS EXISTS:
 * The GUI backend (hosted on Render) processes accounts sequentially with HTTP overhead,
 * Supabase polling, and server sleep cycles — making it slow (~2 rec/s). This CLI bypasses
 * all of that and talks directly to the Remita API from your local machine, achieving 4-6 rec/s
 * with no server middleman. For bulk validation jobs (10,000+ records), always prefer this CLI
 * over triggering a job through the GUI.
 * 
 * Usage:
 *   node validate-cli.js input.csv [output.csv] [options]
 * 
 * Options:
 *   --concurrency=N     Parallel API calls (default: 50)
 *   --resume=JOBID      Resume a previous run (reads progress file)
 *   --no-supabase       Skip Supabase, write results only to CSV
 *   --delay=MS          Delay between batches in ms (default: 0)
 * 
 * Examples:
 *   node validate-cli.js accounts.csv results.csv
 *   node validate-cli.js accounts.csv results.csv --concurrency=100
 *   node validate-cli.js accounts.csv results.csv --resume=abc123
 *   node validate-cli.js accounts.csv results.csv --no-supabase
 * 
 * To edit,
 * 1. First decide the speed of the validation run by changing the timeout on line 176.
 *    - 5s: A lot faster but will skip valid accounts (Remita sometimes takes longer than 5s to respond)
 *    - 15s: Most accurate but slower. This is best practice.
 *    - Safe recommended value: 15s
 * 
 * 2. Run this command in the terminal:
 *    node validate-cli.js accounts.csv results.csv --concurrency=10 --delay=150
 * 
 * Mini Dictionary:
 * 1. node validate-cli.js — initiates the validation script
 * 2. accounts.csv — the input CSV file containing account numbers. Always keep this filename.
 * 3. results.csv — the output file generated with validation results. Never edit this file manually.
 * 4. concurrency=10 — the number of simultaneous requests sent to the Remita API at the same time,
 *    one request per account number. So concurrency=10 means 10 separate API calls firing in parallel,
 *    each validating one account. Safe amount is 10 — going higher risks Remita rate-limiting you
 *    (you'll see HTML error responses instead of JSON when this happens).
 * 5. delay=150 — the delay in milliseconds between each batch of API calls. 150ms is the safe amount.
 *    This gives Remita breathing room between batches and reduces the chance of rate-limiting.
 * 
 * So for instance: a batch of 10 accounts is sent simultaneously, each account waits up to 15s
 * for Remita to respond, then after all 10 finish, the script waits 150ms before sending the next
 * batch of 10.
 * 
 * 'ctrl + c' ends the validation run.
 * 'del results.csv' deletes the results file.
 * 'del progress_accounts.json' deletes the progress file of the last validation run
 *  (always do this before starting a fresh run).
*/

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import fetch from 'node-fetch';

// ─── Config ──────────────────────────────────────────────────────────────────

const MERCHANT_ID = process.env.REMITA_MERCHANT_ID;
const API_KEY = process.env.REMITA_API_KEY;
const API_TOKEN = process.env.REMITA_API_TOKEN;
const BASE_URL = "https://login.remita.net/remita/exapp/api/v1/send/api";
const AES_KEY = process.env.REMITA_AES_KEY;
const AES_IV = process.env.REMITA_AES_IV;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    flags[key] = val ?? true;
  } else {
    positional.push(arg);
  }
}

const INPUT_FILE = positional[0];
const OUTPUT_FILE = positional[1] || `results_${Date.now()}.csv`;
const CONCURRENCY = parseInt(flags.concurrency || '50');
const RESUME_JOB_ID = flags.resume || null;
const USE_SUPABASE = flags['no-supabase'] !== true && !!(SUPABASE_URL && SUPABASE_KEY);
const BATCH_DELAY_MS = parseInt(flags.delay || '0');
const PROGRESS_FILE = `progress_${path.basename(INPUT_FILE, '.csv')}.json`;

// ─── Validate input ───────────────────────────────────────────────────────────

if (!INPUT_FILE) {
  console.error('Usage: node validate-cli.js input.csv [output.csv] [--concurrency=50] [--no-supabase]');
  process.exit(1);
}

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`Error: Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(str, len, char = '0') {
  return str.toString().padStart(len, char);
}

function padAccountNo(accountNo) {
  return accountNo.toString().padStart(10, '0');
}

function padBankCode(bankCode) {
  return bankCode.length === 2 ? '0' + bankCode : bankCode;
}

function aesEncrypt(rawData) {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(rawData), key, {
    keySize: 128 / 8,
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

function makeTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const h = d.getUTCHours();
  const min = d.getUTCMinutes();
  const sec = d.getUTCSeconds();
  return `${yyyy}-${mm}-${dd}T${h}:${min}:${sec}+000000`;
}

// ─── Validate a single account ────────────────────────────────────────────────

async function validateAccount(rawAccountNo, rawBankCode) {
  const accountNo = padAccountNo(rawAccountNo);
  const bankCode = padBankCode(rawBankCode);

  const encAccountNo = aesEncrypt(accountNo);
  const encBankCode = aesEncrypt(bankCode);

  const requestId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
  const apiHash = CryptoJS.SHA512(API_KEY + requestId + API_TOKEN).toString();

  const headers = {
    'Content-Type': 'application/json',
    MERCHANT_ID: MERCHANT_ID,
    API_KEY: API_KEY,
    REQUEST_ID: requestId,
    REQUEST_TS: makeTimestamp(),
    API_DETAILS_HASH: apiHash,
  };

  try {
    const response = await fetch(
      `${BASE_URL}/rpgsvc/rpg/api/v2/merc/fi/account/lookup`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ accountNo: encAccountNo, bankCode: encBankCode }),
        signal: AbortSignal.timeout(10000), // 10s — safe recommended timeout. See notes at top of file.
      }
    );

    const text = await response.text();

    // Remita sometimes returns HTML error pages instead of JSON when rate-limited
    if (text.trim().startsWith('<')) {
      return { accountNo, bankCode, accountName: '', status: 'error', error: 'Remita API returned HTML (likely rate limited)' };
    }

    const data = JSON.parse(text);
    const accountName = data?.data?.accountName || '';
    return {
      accountNo,
      bankCode,
      accountName,
      status: accountName ? 'success' : 'invalid',
      error: accountName ? null : (data?.data?.responseDescription || 'Invalid account'),
    };
  } catch (err) {
    return { accountNo, bankCode, accountName: '', status: 'error', error: err.message };
  }
}

// ─── Process in concurrent batches ───────────────────────────────────────────

async function processBatch(records) {
  const results = await Promise.allSettled(
    records.map(r => validateAccount(r.accountNo, r.bankCode))
  );
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : {
      accountNo: records[i].accountNo,
      bankCode: records[i].bankCode,
      accountName: '',
      status: 'error',
      error: r.reason?.message || 'Unknown error',
    }
  );
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1)
    .map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    })
    .filter(r => r.accountNo || r.bankCode);
}

function writeCSVRow(fd, row) {
  const line = [
    `"${row.accountNo || ''}"`,
    `"${row.bankCode || ''}"`,
    `"${row.accountName || ''}"`,
    `"${row.status || ''}"`,
    `"${(row.error || '').replace(/"/g, "'")}"`,
  ].join(',') + '\n';
  fs.writeSync(fd, line);
}

// ─── Progress tracking ────────────────────────────────────────────────────────

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch { }
  }
  return null;
}

function saveProgress(data) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

// ─── Supabase integration ─────────────────────────────────────────────────────

let supabase = null;
if (USE_SUPABASE) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase connected');
} else {
  console.log('⚠️  Running without Supabase (results to CSV only)');
}

async function createJob(total) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('jobs')
    .insert({ status: 'processing', total_records: total, processed_count: 0, failed_count: 0 })
    .select()
    .single();
  if (error) { console.warn('Supabase job create failed:', error.message); return null; }
  return data.id;
}

async function bulkInsertResults(jobId, rows, sequenceOffset) {
  if (!supabase || !jobId) return;
  const payload = rows.map((r, i) => ({
    job_id: jobId,
    sequence_number: sequenceOffset + i,
    account_no: r.accountNo,
    bank_code: r.bankCode,
    account_name: r.accountName || '',
    validation_status: r.status,
    error_message: r.error || null,
  }));
  const { error } = await supabase.from('validation_results').insert(payload);
  if (error) console.warn('Supabase insert failed:', error.message);
}

async function updateJobProgress(jobId, processed, failed) {
  if (!supabase || !jobId) return;
  await supabase
    .from('jobs')
    .update({ processed_count: processed, failed_count: failed, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}

async function finalizeJob(jobId, status) {
  if (!supabase || !jobId) return;
  await supabase
    .from('jobs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}

// ─── ETA formatter ────────────────────────────────────────────────────────────

function formatETA(remainingMs) {
  if (remainingMs < 0 || !isFinite(remainingMs)) return '?';
  const s = Math.round(remainingMs / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏦 Bank Account Validator CLI');
  console.log('═'.repeat(50));
  console.log(`📂 Input:       ${INPUT_FILE}`);
  console.log(`📤 Output:      ${OUTPUT_FILE}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY} parallel requests`);
  console.log(`🗄️  Supabase:    ${USE_SUPABASE ? 'enabled' : 'disabled'}`);
  console.log('═'.repeat(50));

  // Read & parse input CSV
  console.log('\n📖 Reading input file...');
  const csvText = fs.readFileSync(INPUT_FILE, 'utf8');
  const allRecords = parseCSV(csvText);

  if (allRecords.length === 0) {
    console.error('❌ No valid records found in CSV');
    process.exit(1);
  }

  console.log(`✅ Found ${allRecords.length.toLocaleString()} records`);

  // Load progress if resuming
  let startIndex = 0;
  let jobId = null;
  const existingProgress = loadProgress();

  if (RESUME_JOB_ID && existingProgress) {
    startIndex = existingProgress.processedCount || 0;
    jobId = RESUME_JOB_ID;
    console.log(`\n🔄 Resuming from record ${startIndex.toLocaleString()} (job: ${jobId})`);
  } else {
    // Create Supabase job
    jobId = await createJob(allRecords.length);
    if (jobId) console.log(`\n🆔 Supabase Job ID: ${jobId}`);
  }

  // Open output CSV (append if resuming, write if fresh)
  const outputMode = startIndex > 0 ? 'a' : 'w';
  const outputFd = fs.openSync(OUTPUT_FILE, outputMode);

  if (startIndex === 0) {
    // Write header
    fs.writeSync(outputFd, 'accountNo,bankCode,accountName,status,error\n');
  }

  // Track stats
  let processedCount = startIndex;
  let successCount = 0;
  let failedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  const reportEvery = Math.max(CONCURRENCY, 100); // Log progress every N records

  console.log(`\n🚀 Starting validation from record ${startIndex + 1}...\n`);

  // Main processing loop
  for (let i = startIndex; i < allRecords.length; i += CONCURRENCY) {
    const batch = allRecords.slice(i, i + CONCURRENCY);
    const batchResults = await processBatch(batch);

    // Write results to CSV immediately
    for (const r of batchResults) {
      writeCSVRow(outputFd, r);
      if (r.status === 'success') successCount++;
      else if (r.status === 'invalid') failedCount++;
      else errorCount++;
    }

    processedCount += batchResults.length;

    // Supabase bulk insert
    await bulkInsertResults(jobId, batchResults, i);

    // Update job progress every reportEvery records
    if (processedCount % reportEvery < CONCURRENCY || processedCount >= allRecords.length) {
      await updateJobProgress(jobId, processedCount, failedCount + errorCount);

      // Save local progress
      saveProgress({ processedCount, jobId, inputFile: INPUT_FILE, outputFile: OUTPUT_FILE });

      // Calculate ETA
      const elapsed = Date.now() - startTime;
      const rate = (processedCount - startIndex) / (elapsed / 1000);
      const remaining = allRecords.length - processedCount;
      const etaMs = (remaining / rate) * 1000;
      const pct = ((processedCount / allRecords.length) * 100).toFixed(1);

      process.stdout.write(
        `\r⚡ ${processedCount.toLocaleString()}/${allRecords.length.toLocaleString()} (${pct}%) ` +
        `✅ ${successCount} ❌ ${failedCount} ⚠️  ${errorCount} ` +
        `| ${rate.toFixed(0)} rec/s | ETA: ${formatETA(etaMs)}   `
      );
    }

    // Optional delay between batches (if Remita rate-limits you)
    if (BATCH_DELAY_MS > 0 && i + CONCURRENCY < allRecords.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // Close output file
  fs.closeSync(outputFd);

  // Finalize Supabase job
  await finalizeJob(jobId, 'completed');

  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);

  // Final report
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = ((allRecords.length - startIndex) / parseFloat(totalTime)).toFixed(0);

  console.log('\n\n' + '═'.repeat(50));
  console.log('✅ COMPLETE');
  console.log('═'.repeat(50));
  console.log(`📊 Total records:  ${allRecords.length.toLocaleString()}`);
  console.log(`✅ Valid accounts: ${successCount.toLocaleString()}`);
  console.log(`❌ Invalid:        ${failedCount.toLocaleString()}`);
  console.log(`⚠️  API errors:     ${errorCount.toLocaleString()}`);
  console.log(`⏱️  Time taken:     ${totalTime}s`);
  console.log(`⚡ Avg speed:      ${rate} records/second`);
  console.log(`📤 Output saved:   ${OUTPUT_FILE}`);
  if (jobId) console.log(`🆔 Job ID:         ${jobId}`);
  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
