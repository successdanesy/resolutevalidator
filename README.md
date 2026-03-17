# 🏦 Resolute Validator: Enterprise Account Verification

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

Resolute Validator is a high-performance, enterprise-grade account verification engine built for modern financial workflows. It abstracts the complexity of Nigerian banking integrations into a seamless, high-speed validation layer.

## 📖 The Origin Story

Before Resolute, I worked in an operations department where verifying thousands of bank account numbers was a manual, daily ritual. We had to cross-reference spreadsheets, log into multiple portals, and verify names one by one. It was a massive bottleneck—prone to human error and a serious drain on productivity.

I built this tool to solve that exact pain point. By leveraging the **Remita API**, we've automated what used to take hours into a process that takes seconds.

### Why Remita?
Remita is a leading Nigerian financial services provider that provides the underlying infrastructure for many of the country's most critical payment systems. We use their **Account Lookup API** because it provides direct, authoritative access to the NIBSS (Nigeria Inter-Bank Settlement System) network, ensuring that the validation results are 100% accurate and reflect real-time banking data.

## 🚀 Key Capabilities

- **Single & Batch Validation**: Instant lookup for individual accounts or high-volume CSV processing (up to 5,000 records).
- **Floating Navigation System**: A premium, "app-like" navigation experience using a Floating Action Button (FAB) to clear screen congestion.
- **Bank Directory**: Comprehensive reference for Nigerian financial institutions, categorized by Commercial and Microfinance banks.
- **Intelligent Batching**: Proprietary chunking logic with controlled concurrency to respect API rate limits while maximizing throughput.
- **Persistent Job Tracking**: Background processing with persistent state in Supabase, allowing users to track and resume long-running jobs even after browser closure.
- **Analytics Dashboard**: Real-time visualization of validation success rates and volume metrics.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, CryptoJS (AES-128 Encryption).
- **Database**: Supabase (PostgreSQL) for job persistence and result storage.
- **API Integration**: Remita Financial Services API.

---

## 📂 Project Structure

```text
├── api/                    # Serverless function handlers
├── backend/                # Express API Server
│   ├── utils/              # Encryption and API helpers
│   └── server.js           # API Entry point
├── src/                    # Frontend Application
│   ├── components/         # UI Components (ShadcnUI + Custom)
│   ├── page/               # Main application pages (Home, Validator, BankCodes)
│   └── utils/              # Frontend helpers & Bank data
├── public/                 # Static assets
└── supabase/               # Database schemas and migrations
```

---

## 🏗️ Getting Started

### 1. Prerequisites
- Node.js v18+ & npm
- A Supabase Project
- Remita Merchant Credentials

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root and backend directories:

```env
# Root/Backend .env
REMITA_MERCHANT_ID=your_id
REMITA_API_KEY=your_key
REMITA_API_TOKEN=your_token
REMITA_AES_KEY=your_16_char_key
REMITA_AES_IV=your_16_char_iv
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
BATCH_PIN=your_4_digit_pin
```

### 3. Installation & Run
```bash
# Install & Start Frontend
npm install
npm run dev

# Install & Start Backend
cd backend && npm install
npm start
```

---

## 🔒 Security Best Practices

This repository is hardened for public production environments:
- **AES-128 Encryption**: Account details are encrypted before transmission to the Remita gateway.
- **Zero Secrets**: All sensitive data is managed via environment variables.
- **Startup Protection**: The backend performs fail-fast validation of all required environment variables on startup.

## 📊 CSV Schema for Batching
The engine expects a CSV with these specific headers:
| accountNo | bankCode |
| :--- | :--- |
| 1234567890 | 011 |
| 0987654321 | 058 |

---

## 👤 Author & Support
**Success Chukwuemeka**
*   **Portfolio**: [successdanesy.vercel.app](https://successdanesy.vercel.app)
*   **LinkedIn**: [Success Chukwuemeka](https://www.linkedin.com/in/success-chu)
*   **Email**: [successdanesy@gmail.com](mailto:successdanesy@gmail.com)

---
© 2026 Success Chukwuemeka. All rights reserved.

