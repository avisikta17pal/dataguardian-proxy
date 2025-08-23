Run the FastAPI backend

Requirements: Python 3.11+, packages in requirements.txt.

Start server:

- Without virtualenv (if venv not allowed), install with `pip install --break-system-packages -r requirements.txt` then:

```
uvicorn app.main:app --reload --port 8001 --app-dir app
```

API paths:
- POST /datasets/
- GET /streams/{id}/data