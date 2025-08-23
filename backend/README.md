# FastAPI Backend

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: http://127.0.0.1:8000

Endpoints:

- /datasets
- /rules
- /streams
- /tokens
- /audit
- /health