# Data Guardian Proxy – AI Privacy Shield for Personal Data


## 🏆 International Innovation Challenge 2.0 — Manipal University Jaipur
- **Theme**: Cyber Vigilance and Digital Sovereignty
- **Team**: Team Venus
- **Project Title**: Data Guardian Proxy – AI Privacy Shield for Personal Data
- **Team Members**: Avisikta Pal, Sattick Biswas, Ritashree Das


## 🔐 Problem Statement
Individuals are repeatedly asked to share raw personal data with apps and services, often without clear limits or auditability. This creates risks of over-collection, misuse, and uncontrolled retention, undermining user trust and digital sovereignty.


## ✅ Our Solution
**Data Guardian Proxy (DGP)** lets citizens share only purpose-specific, time-bound, privacy-protected data streams instead of raw datasets. Users upload data, define privacy rules (drop PII, aggregate, obfuscate), and generate revocable access tokens for apps. Every access is auditable and consent receipts can be generated for proof of responsible data sharing.


## ✨ Key Features
- **Upload & Inspect Datasets**: Drag-and-drop CSVs; schema inference, basic PII detection, SHA-256 dataset fingerprinting
- **Privacy Rules**: Select fields, add filters/aggregations, and obfuscation controls (jitter, rounding, k-anonymity)
- **Advanced Privacy (new)**: `dropPII` supports boolean or list; optional `dpNoise` (Laplace) and a lightweight `synthetic` mode for distribution-preserving generation
- **Time-Limited Streams**: Generate purpose-built, expiring streams, enforced by tokens and stream status
- **Scoped Tokens**: Create revocable tokens (one-time or expiring) for controlled access
- **Auditing & Receipts**: End-to-end audit trail and printable consent receipts (HTML/PDF)
- **Auto-Cleanup (new)**: Background task to auto-expire streams, auto-revoke tokens, and purge unused dataset files; manual `POST /audit/maintenance/cleanup` endpoint
- **Demo Mode**: Fully functional demo using local storage and mock data—no backend required
- **Modern UI**: shadcn/ui + Tailwind + Radix with guided UX


## 🧰 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Router, Zustand, TanStack Query, shadcn/ui, TailwindCSS, Lucide Icons
- **Backend**: FastAPI, Uvicorn, SQLAlchemy (SQLite), Pydantic, Pandas/Numpy, ReportLab
- **Data**: CSV ingestion, schema inference, SHA-256 hashing
- **Build/Tooling**: ESLint, TypeScript, PostCSS, Vite


## 🏗️ Architecture Overview
- **Web App** (React + Vite)
  - Manages datasets, rules, streams, tokens, audits
  - Demo mode persists to localStorage and loads mock JSON/CSV from `public/`
  - API mode targets the FastAPI backend via a configurable base URL
- **API Server** (FastAPI)
  - Endpoints: `/datasets`, `/rules`, `/streams`, `/tokens`, `/audit`
  - Privacy pipeline: filters → field selection → aggregations → obfuscation → optional synthetic generation
  - Token validation and stream expiry enforcement
  - Background cleanup task + manual maintenance endpoint

High-level flow:
1) Upload dataset → schema inferred + PII hints → dataset hash computed
2) Define privacy rule → fields, filters, aggregations, obfuscation (+dpNoise/synthetic optional)
3) Create stream → optional token generation → share tokenized access
4) App accesses stream via token → audits recorded → optional consent receipt
5) Background cleanup auto-expires streams/tokens and purges unused dataset files


## 📂 Repository Structure
```
backend/
  app/
    core/            # DB engine (SQLite), config, data dir
    models/          # SQLAlchemy models: Dataset, Rule, Stream, Token, Audit
    routers/         # FastAPI routers for datasets, rules, streams, tokens, audit
    schemas/         # Pydantic schemas
    services/        # data_processing (privacy), tokens, cleanup (auto-maintenance)
    utils/           # receipts
    main.py          # app, CORS, router registration, background cleanup
  requirements.txt
  README.md
src/
  components/        # Layout, sidebar, topbar, UI primitives
  pages/             # Dashboard, Datasets, Rules, Streams, Tokens, Audit, Settings
  services/          # API abstraction (demo mode + future API mode)
  stores/            # Zustand stores for datasets/rules/streams/tokens/settings
  types.ts           # Shared TypeScript types
public/
  samples/           # Sample CSVs (e.g., fitness.csv, bank.csv)
  mock/              # Mock JSON for demo mode
index.html
vite.config.ts
package.json
```


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+ (backend)

### Frontend (Demo Mode — no backend required)
```
npm install
npm run dev
```
- App runs at `http://localhost:8080`
- Demo mode is enabled by default. Toggle under Settings → Demo Mode.
- Sample datasets under `public/samples`.

### Backend (API Mode)
```
cd backend
pip install --break-system-packages -r requirements.txt
uvicorn app.main:app --reload --port 8001 --app-dir app
```
- API runs at `http://localhost:8001`
- CORS default allows `http://localhost:3000` (adjust in `backend/app/main.py`)

### Switch Frontend to API Mode
- In the app Settings
- Disable “Demo Mode” and set “API Base URL” to your backend URL (e.g., `http://localhost:8001`)


## 🧪 Demo Script (What to Show Judges)
1. Login (any credentials in demo mode)
2. Datasets → Upload `public/samples/fitness.csv` or your `dgp_synth_10000.csv` → note schema, PII hints, SHA-256
3. Rules → Create rule:
   - Fields: only necessary columns
   - Obfuscation: `dropPII=true`, `rounding=10`, `jitter={percent:5}`
   - Optional advanced: `dpNoise={scale:1.0}` or `synthetic={rows:500, shuffle:true}`
4. Streams → Create stream from dataset + rule, set expiry (e.g., 24h) → generate token
5. Tokens → Show token, revoke it → try to access and show it fails
6. Audit → Show events; then generate a consent receipt (HTML/PDF)
7. Cleanup → Call `POST /audit/maintenance/cleanup` (or wait for background task) → show expired streams/tokens no longer accessible


## 📡 API Quick Reference
- `POST /datasets/`
- `POST /rules/`, `GET /rules/`
- `POST /streams/`, `GET /streams/`, `GET /streams/{id}/data?token=...`, `GET /streams/{id}/export?format=csv|json&token=...`
- `POST /tokens/`, `GET /tokens/`, `POST /tokens/{id}/revoke`
- `GET /audit/`, `GET /audit/{stream_id}/receipt?format=html|pdf`
- (new) `POST /audit/maintenance/cleanup`


## ✅ Validation & Checks
- Token/stream expiry: Verify 401 after expiry or revocation
- Privacy: Confirm dropped PII columns and obfuscation effects in preview/export
- Synthetic: Enable `synthetic` in rule and confirm rows are generated and unlinkable
- Cleanup: Check audit events `stream_expired`, `token_revoked`, `dataset_purged`


## 🌍 Impact
- **Privacy by Design**: Minimum necessary data for a declared purpose
- **User Agency**: Time-limited, revocable, auditable access tokens
- **Trustworthy AI**: Transparent, revocable sharing with receipts
- **Infra-level Innovation**: Citizen-first “permission-by-proxy” architecture


## 📝 Hackathon Details
- **Event**: International Innovation Challenge 2.0
- **Host**: Manipal University Jaipur
- **Theme**: Cyber Vigilance and Digital Sovereignty
- **Team**: Team Venus — Avisikta Pal, Sattick Biswas, Ritashree Das


## 📬 Contact
- **Email**: teamvenus.dataguardian@gmail.com
- **Members**: Avisikta Pal · Sattick Biswas · Ritashree Das
- **Project**: Data Guardian Proxy — AI Privacy Shield for Personal Data