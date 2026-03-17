import { useState, useEffect, useRef } from "react";
import { Upload, Download, CheckCircle, AlertCircle, FileText, User, Mail, Phone, Building2, Menu, X, XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BANK_CODES from '../utils/bankCodes';
import { PulseBeams } from "../components/ui/pulse-beams";

export default function Validator() {
    const [accountNo, setAccountNo] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [jobId, setJobId] = useState(null);
    const [completedJobs, setCompletedJobs] = useState([]);
    const [manualJobId, setManualJobId] = useState("");
    const [progress, setProgress] = useState({
        current: 0,
        total: 0,
        percentage: 0
    });
    const [connectionError, setConnectionError] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // PIN States
    const [isBatchUnlocked, setIsBatchUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState(false);

    const pollIntervalRef = useRef(null);
    const resultsRef = useRef(null);

    const getApiBaseUrl = () => {
        if (import.meta.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return 'http://localhost:8080/api';
        return 'https://bank-validator-backend.onrender.com/api';
    };

    useEffect(() => {
        const saved = localStorage.getItem('completedJobsAnalytics');
        if (saved) setCompletedJobs(JSON.parse(saved));
        const activeJobId = localStorage.getItem('activeJobId');
        if (activeJobId) {
            setJobId(activeJobId);
            setLoading(true);
            resumeJob(activeJobId);
        }
    }, []);

    // Auto-scroll to results when validation finishes
    useEffect(() => {
        if (!loading && results.length > 0 && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [loading, results.length]);

    useEffect(() => {
        if (!jobId || !loading) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            return;
        }

        localStorage.setItem('activeJobId', jobId);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            try {
                const apiBase = getApiBaseUrl();
                const response = await fetch(`${apiBase}/jobs/${jobId}`, { signal: AbortSignal.timeout(10000) });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const job = await response.json();
                setConnectionError(false);
                setProgress({
                    current: job.processed_count,
                    total: job.total_records,
                    percentage: job.total_records > 0 ? Math.round((job.processed_count / job.total_records) * 100) : 0
                });

                if (job.status === 'completed') {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    await fetchAllResults(jobId);
                    setLoading(false);
                    localStorage.removeItem('activeJobId');
                } else if (job.status === 'failed') {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setLoading(false);
                    localStorage.removeItem('activeJobId');
                    alert("Batch processing failed. Please try again.");
                } else if (job.status === 'cancelled') {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    await fetchAllResults(jobId);
                    setLoading(false);
                    localStorage.removeItem('activeJobId');
                    alert(`Job cancelled. Processed ${job.processed_count} of ${job.total_records} records.`);
                }
            } catch (err) {
                console.error("Poll error:", err);
                setConnectionError(true);
            }
        }, 2000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [jobId, loading]);

    const resumeJob = async (id) => {
        try {
            const apiBase = getApiBaseUrl();
            const response = await fetch(`${apiBase}/jobs/${id}`);
            if (!response.ok) throw new Error("Failed to fetch job");
            const job = await response.json();
            setProgress({
                current: job.processed_count,
                total: job.total_records,
                percentage: job.total_records > 0 ? Math.round((job.processed_count / job.total_records) * 100) : 0
            });
            if (job.status === 'pending' || job.status === 'processing') {
                setLoading(true);
            } else if (job.status === 'completed') {
                await fetchAllResults(id);
                localStorage.removeItem('activeJobId');
            } else if (job.status === 'cancelled') {
                await fetchAllResults(id);
                localStorage.removeItem('activeJobId');
            }
        } catch (err) {
            console.error("Resume error:", err);
            localStorage.removeItem('activeJobId');
        }
    };

    const cancelJob = async () => {
        if (!jobId) return;
        const confirmed = window.confirm(`Cancel this job? Processed: ${progress.current}/${progress.total}`);
        if (!confirmed) return;
        setCancelling(true);
        try {
            const apiBase = getApiBaseUrl();
            const response = await fetch(`${apiBase}/jobs/${jobId}/cancel`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to cancel job');
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            await fetchAllResults(jobId);
            setLoading(false);
            localStorage.removeItem('activeJobId');
        } catch (err) {
            console.error("Cancel error:", err);
        } finally {
            setCancelling(false);
        }
    };

    const fetchAllResults = async (id) => {
        try {
            const apiBase = getApiBaseUrl();
            let allResults = [];
            let offset = 0;
            const BATCH_SIZE = 1000;
            let hasMore = true;
            while (hasMore) {
                const response = await fetch(`${apiBase}/jobs/${id}/results?offset=${offset}&limit=${BATCH_SIZE}`);
                if (!response.ok) throw new Error("Failed to fetch results");
                const batch = await response.json();
                if (batch.length === 0) {
                    hasMore = false;
                } else {
                    allResults = [...allResults, ...batch];
                    offset += BATCH_SIZE;
                    if (batch.length < BATCH_SIZE) hasMore = false;
                }
            }
            setResults(allResults);
        } catch (err) {
            console.error("Error fetching results:", err);
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => { row[header] = values[index] || ''; });
            if (row.accountNo || row.bankCode) data.push(row);
        }
        return data;
    };

    const createCSV = (data) => {
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = headers.map(header => `"${row[header] || ''}"`);
            csvRows.push(values.join(','));
        });
        return csvRows.join('\n');
    };

    const handleValidate = async () => {
        if (!accountNo.trim() || !bankCode.trim()) {
            alert("Please enter both account number and bank code");
            return;
        }
        setLoading(true);
        try {
            const apiBase = getApiBaseUrl();
            const response = await fetch(`${apiBase}/validate-account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountNo, bankCode }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setResults([{
                id: Date.now(),
                account_no: data.accountNo,
                bank_code: data.bankCode,
                account_name: data.accountName,
                validation_status: data.accountName ? 'success' : 'invalid',
                error_message: data.response
            }]);
        } catch (err) {
            console.error("Single validation error:", err);
            alert("Error validating account.");
        } finally {
            setLoading(false);
        }
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvData = parseCSV(event.target.result);
                if (csvData.length === 0) {
                    alert("No valid data found in CSV file");
                    return;
                }
                setLoading(true);
                setResults([]);
                setProgress({ current: 0, total: csvData.length, percentage: 0 });
                const apiBase = getApiBaseUrl();
                const response = await fetch(`${apiBase}/validate-batch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rows: csvData, pin: pinInput }),
                });
                if (!response.ok) throw new Error("Failed to create job");
                const { jobId: newJobId } = await response.json();
                setJobId(newJobId);
            } catch (err) {
                console.error("Batch error:", err);
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const exportCSV = () => {
        const exportData = results.map((r) => ({
            "Account No": r.account_no || r.accountNo,
            "Bank Code": r.bank_code || r.bankCode,
            "Account Name": r.account_name || r.accountName || '',
            "Status": r.validation_status || (r.account_name ? 'Valid' : 'Invalid'),
        }));
        const csv = createCSV(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resolute_results_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const downloadCSVTemplate = () => {
        const csv = createCSV([{ accountNo: "1234567890", bankCode: "011" }]);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "resolute_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const clearResults = () => {
        if (results.length > 0 && jobId) {
            const validCount = results.filter(r => (r.account_name || r.accountName) && (r.account_name || r.accountName).trim() !== "").length;
            const jobStats = {
                id: jobId,
                timestamp: new Date().toISOString(),
                totalRecords: results.length,
                validAccounts: validCount,
                invalidAccounts: results.length - validCount,
                successRate: Math.round((validCount / results.length) * 100)
            };
            const updated = [...completedJobs, jobStats];
            setCompletedJobs(updated);
            localStorage.setItem('completedJobsAnalytics', JSON.stringify(updated));
        }
        setResults([]);
        setUploadedFileName("");
        setAccountNo("");
        setBankCode("");
        setJobId(null);
        setProgress({ current: 0, total: 0, percentage: 0 });
    };

    const validAccounts = results.filter(r => (r.account_name || r.accountName) && (r.account_name || r.accountName).trim() !== "").length;
    const invalidAccounts = results.length - validAccounts;

    const renderAnalyticsDashboard = () => {
        if (completedJobs.length === 0) return null;
        const totalValidations = completedJobs.reduce((sum, job) => sum + job.totalRecords, 0);
        const totalValid = completedJobs.reduce((sum, job) => sum + job.validAccounts, 0);
        const totalInvalid = completedJobs.reduce((sum, job) => sum + job.invalidAccounts, 0);

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Jobs Completed", value: completedJobs.length, bg: "bg-gray-50", text: "text-gray-900" },
                    { label: "Total Records", value: totalValidations.toLocaleString(), bg: "bg-gray-50", text: "text-gray-900" },
                    { label: "Valid Accounts", value: totalValid.toLocaleString(), bg: "bg-blue-50", text: "text-blue-600" },
                    { label: "Invalid Found", value: totalInvalid.toLocaleString(), bg: "bg-red-50", text: "text-red-600" },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} border border-gray-100 rounded-2xl p-5`}>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
        );
    };

    const handleTrackJob = async () => {
        if (!manualJobId.trim()) return;
        setManualJobId("");
        setJobId(manualJobId.trim());
        setLoading(true);
        await resumeJob(manualJobId.trim());
    };

    const handleUnlockBatch = async () => {
        if (pinInput.length !== 4) {
            setPinError(true);
            return;
        }

        try {
            const apiBase = getApiBaseUrl();
            const response = await fetch(`${apiBase}/verify-pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: pinInput }),
            });

            if (response.ok) {
                setIsBatchUnlocked(true);
                setPinError(false);
            } else {
                setPinError(true);
                alert("Incorrect PIN. ACCESS DENIED.");
            }
        } catch (err) {
            console.error("PIN Verification error:", err);
            alert("Error connecting to server for PIN verification.");
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredBanks = BANK_CODES.filter(bank => 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bank.code.includes(searchTerm)
    );

    const handleSelectBank = (bank) => {
        setBankCode(bank.code);
        setSearchTerm(bank.name);
        setIsDropdownOpen(false);
    };

    return (
        <div className="min-h-screen bg-white py-12 transition-colors">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="mb-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>

                    <p className="text-gray-600">Enterprise-grade account verification engine.</p>
                </div>

                {renderAnalyticsDashboard()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Single Validation */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-600/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Single Validation</h2>
                        </div>

                        {/* Insights Card for symmetry */}
                        <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100/50 mb-6">
                            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Validation Insights
                            </h4>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 leading-relaxed">Real-time verification ensures account numbers match their registered bank names.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 leading-relaxed">Ensure the 10-digit NUBAN is entered correctly for the chosen bank.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter 10-digit number"
                                    value={accountNo}
                                    onChange={(e) => setAccountNo(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 transition-all font-mono"
                                />
                            </div>
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Select or Search Bank</label>
                                <input
                                    type="text"
                                    placeholder="Search by name or code..."
                                    value={searchTerm}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 transition-all"
                                />
                                {isDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                        {filteredBanks.length > 0 ? (
                                            filteredBanks.map((bank, index) => (
                                                <div
                                                    key={`${bank.code}-${index}`}
                                                    onClick={() => handleSelectBank(bank)}
                                                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                                >
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{bank.name}</span>
                                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-600">{bank.code}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-gray-400 italic">No banks found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleValidate}
                                disabled={loading || !bankCode}
                                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <CheckCircle className="h-5 w-5" />}
                                {loading ? "Verifying..." : "Validate Account"}
                            </button>
                        </div>
                    </div>

                    {/* Batch Upload */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-600/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <Upload className="h-5 w-5 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Batch Processing</h2>
                        </div>

                        <div className="relative overflow-visible">
                            <div className={`space-y-6 ${!isBatchUnlocked ? 'blur-md pointer-events-none select-none opacity-40' : 'transition-all duration-500'}`}>
                                {/* How To Card */}
                                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Quick Guide
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { step: "1", text: "Download CSV Template" },
                                            { step: "2", text: "Fill accountNo & bankCode" },
                                            { step: "3", text: "Upload file to process" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="flex-shrink-0 h-5 w-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {item.step}
                                                </span>
                                                <p className="text-xs text-blue-800 leading-tight">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">CSV Requirements</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Headers must include <code className="text-blue-600 font-bold">accountNo</code> and <code className="text-blue-600 font-bold">bankCode</code>.
                                        Maximum 5,000 records per batch.
                                    </p>
                                </div>

                                <button
                                    onClick={downloadCSVTemplate}
                                    className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-900 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="h-5 w-5" /> Download Template
                                </button>

                                <div className="relative">
                                    <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={loading} className="hidden" id="csv-upload" />
                                    <label
                                        htmlFor="csv-upload"
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 cursor-pointer"
                                    >
                                        <Upload className="h-5 w-5" /> {loading ? "Processing..." : "Upload CSV File"}
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Track Existing Job</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Job ID"
                                            value={manualJobId}
                                            onChange={(e) => setManualJobId(e.target.value)}
                                            className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-600"
                                        />
                                        <button
                                            onClick={handleTrackJob}
                                            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all border border-transparent"
                                        >
                                            Track
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Unlock Overlay - Positioned outside the blurred div */}
                            {!isBatchUnlocked && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-hidden">
                                    <PulseBeams
                                        beams={[
                                            {
                                                path: "M0 50 H300",
                                                gradientConfig: {
                                                    initial: { x1: "0%", x2: "0%", y1: "0%", y2: "0%" },
                                                    animate: { x1: ["0%", "100%"], x2: ["0%", "100%"], y1: ["0%", "0%"], y2: ["0%", "0%"] },
                                                    transition: { duration: 3, repeat: Infinity, ease: "linear" }
                                                }
                                            },
                                            {
                                                path: "M0 150 H300",
                                                gradientConfig: {
                                                    initial: { x1: "0%", x2: "0%", y1: "0%", y2: "0%" },
                                                    animate: { x1: ["100%", "0%"], x2: ["100%", "0%"], y1: ["0%", "0%"], y2: ["0%", "0%"] },
                                                    transition: { duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }
                                                }
                                            }
                                        ]}
                                        width={300}
                                        height={200}
                                        className="h-full w-full"
                                        baseColor="rgba(59, 130, 246, 0.1)"
                                        accentColor="rgba(59, 130, 246, 0.4)"
                                    >
                                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-2xl text-center max-w-[280px] relative z-20">
                                            <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Building2 className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">Batch Validation</h3>
                                            <p className="text-xs text-gray-500 mb-6">We had to lock this to prevent API abuse. <br /> Enter the 4-digit PIN you were assigned to unlock batch processing.</p>

                                            <input
                                                type="password"
                                                maxLength={4}
                                                placeholder="••••"
                                                value={pinInput}
                                                onChange={(e) => {
                                                    setPinInput(e.target.value);
                                                    setPinError(false);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUnlockBatch()}
                                                className={`w-full text-center text-2xl tracking-[0.5em] p-3 mb-4 bg-gray-50 border ${pinError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-600 transition-all font-mono`}
                                            />

                                            <button
                                                onClick={handleUnlockBatch}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                Unlock
                                            </button>
                                        </div>
                                    </PulseBeams>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {results.length > 0 && (
                    <div ref={resultsRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-colors scroll-mt-8">
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Results</h2>
                                <p className="text-sm text-gray-500">
                                    <span className="text-green-600 font-bold">{validAccounts} valid</span> • {invalidAccounts} invalid
                                </p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={exportCSV}
                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="h-4 w-4" /> Export CSV
                                </button>
                                <button
                                    onClick={clearResults}
                                    className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-8 text-xs font-bold uppercase tracking-widest text-gray-400">Account No</th>
                                        <th className="text-left py-4 px-8 text-xs font-bold uppercase tracking-widest text-gray-400">Bank Code</th>
                                        <th className="text-left py-4 px-8 text-xs font-bold uppercase tracking-widest text-gray-400">Account Name</th>
                                        <th className="text-left py-4 px-8 text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {results.map((r, i) => {
                                        const isValid = (r.account_name || r.accountName) && (r.account_name || r.accountName).trim() !== "";
                                        return (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-8 font-mono text-sm text-gray-900">{r.account_no || r.accountNo}</td>
                                                <td className="py-4 px-8 font-mono text-sm text-gray-500">{r.bank_code || r.bankCode}</td>
                                                <td className="py-4 px-8 text-sm font-bold text-gray-900">
                                                    {r.account_name || r.accountName || <span className="text-gray-300 font-normal">N/A</span>}
                                                </td>
                                                <td className="py-4 px-8">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        {isValid ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                        {isValid ? 'Valid' : 'Invalid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Progress Modal */}
                {loading && jobId && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
                        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">
                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Batch</h3>
                                <p className="text-gray-500">Validating {progress.current} of {progress.total} accounts</p>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-500"
                                    style={{ width: `${progress.percentage}%` }}
                                ></div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Active Job ID</p>
                                    <code className="text-xs text-gray-900 break-all font-mono">{jobId}</code>
                                </div>

                                <button
                                    onClick={cancelJob}
                                    disabled={cancelling}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {cancelling ? "Cancelling..." : "Cancel Job"}
                                </button>

                                <p className="text-xs text-gray-400 text-center">It's safe to close this window. The job will continue in the background.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
