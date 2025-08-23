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
- **Privacy Rules**: Select fields, add filters/aggregations, and obfuscation controls (jitter, rounding, k-anonymity, noise)
- **Synthetic/Curated Streams**: Generate purpose-built, time-limited data streams
- **Scoped Tokens**: Create revocable tokens (one-time or expiring) for controlled access
- **Auditing & Receipts**: End-to-end audit trail and printable consent receipts (HTML/PDF)
- **Demo Mode**: Fully functional demo using local storage and mock data—no backend required
- **Dark UI + Guided UX**: Modern, accessible UI built with shadcn/ui, Tailwind, and Radix


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
  - SQLite via SQLAlchemy, simple data dir management
  - CORS enabled for local development

High-level flow:
1) User uploads dataset → schema inferred + PII hints → dataset hash computed
2) User defines privacy rule → fields, filters, aggregations, obfuscation
3) User creates stream → optional token generation → share tokenized access
4) App accesses stream via token → audits recorded → optional consent receipt generated


## 📂 Repository Structure
```
backend/
  app/
    core/            # DB engine (SQLite), config, data dir
    models/          # SQLAlchemy models: Dataset, Rule, Stream, Token, Audit
    routers/         # FastAPI routers for datasets, rules, streams, tokens, audit
    schemas/         # Pydantic schemas (if present)
    services/        # Business logic (if present)
    utils/           # Utilities (if present)
    main.py          # FastAPI app, CORS, router registration
  requirements.txt   # Backend dependencies
  README.md          # Backend-specific run instructions
src/
  components/        # Layout, sidebar, topbar, UI primitives
  pages/             # Dashboard, Datasets, Rules, Streams, Tokens, Audit, Settings
  services/          # API abstraction (demo mode + future API mode)
  stores/            # Zustand stores for datasets/rules/streams/tokens/settings
  types.ts           # Shared TypeScript types
public/
  samples/           # Sample CSVs (e.g., fitness.csv, bank.csv)
  mock/              # Mock JSON for demo mode (datasets, rules, streams, tokens, audit)
index.html
vite.config.ts
package.json
```


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+ (only if running backend)

### Frontend (Demo Mode — no backend required)
```
# from repo root
npm install
npm run dev
```
- App runs at `http://localhost:8080`
- Demo mode is enabled by default. Toggle under Settings → Demo Mode.
- Sample datasets available under `public/samples`.

### Backend (Optional API Mode)
```
# in a separate terminal
cd backend
pip install --break-system-packages -r requirements.txt
uvicorn app.main:app --reload --port 8001 --app-dir app
```
- API runs at `http://localhost:8001`
- CORS default allows `http://localhost:3000` (adjust as needed in `backend/app/main.py`)

### Switch Frontend to API Mode
- Go to Settings page in the app
- Disable “Demo Mode” and set “API Base URL” (if exposed in UI) to your backend URL (e.g., `http://localhost:8001`)


## 🧪 Demo Flow (What to Show Judges)
1. **Login** (any credentials in demo mode)
2. **Datasets** → Upload `public/samples/fitness.csv` → observe schema + PII hints + SHA-256
3. **Rules** → Create rule with field selection, add obfuscation (e.g., drop PII + jitter)
4. **Streams** → Create new stream from dataset + rule, set expiry → auto-generate token
5. **Tokens** → View token details; note revoke and expiry options
6. **Audit** → Show recent events; explain consent receipts generation in backend
7. Optional: **Backend** → Hit `GET /streams/{id}/data?token=...` and `GET /streams/{id}/export?format=csv|json&token=...`


## 📡 API Overview (Backend)
Key endpoints (see `backend/README.md` for full details):
- `POST /datasets/`
- `POST /rules/`, `GET /rules/`
- `POST /streams/`, `GET /streams/`, `GET /streams/{id}/data`, `GET /streams/{id}/export`
- `POST /tokens/`, `GET /tokens/`, `POST /tokens/{id}/revoke`
- `GET /audit/`, `GET /audit/{id}/receipt?format=html|pdf`


## 🌍 Impact
- **Privacy by Design**: Minimum necessary data for a declared purpose
- **User Agency**: Time-limited, revocable, auditable access tokens
- **Developer Friendly**: Simple API, clear contracts, consent receipts
- **Scalable Pattern**: Extendable to health, finance, education datasets


## 📝 Hackathon Details
- **Event**: International Innovation Challenge 2.0
- **Host**: Manipal University Jaipur
- **Theme**: Cyber Vigilance and Digital Sovereignty
- **Team**: Team Venus — Avisikta Pal, Sattick Biswas, Ritashree Das


## 📬 Contact
- **Email**: teamvenus.dataguardian@gmail.com
- **Members**: Avisikta Pal · Sattick Biswas · Ritashree Das
- **Project**: Data Guardian Proxy — AI Privacy Shield for Personal Data