Run the FastAPI backend

Requirements: Python 3.11+, packages in requirements.txt.

Install dependencies:

```
pip install --break-system-packages -r requirements.txt
```

Start server:

```
uvicorn app.main:app --reload --port 8001 --app-dir app
```

CORS: Allowed origin http://localhost:3000

Endpoints overview:
- POST /datasets/
- POST /rules/
- GET /rules/
- POST /streams/
- GET /streams/
- GET /streams/{id}/data?token=...
- GET /streams/{id}/export?format=csv|json&token=...
- POST /tokens/
- GET /tokens/
- POST /tokens/{id}/revoke
- GET /audit/
- GET /audit/{id}/receipt?format=html|pdf

Example flow
1) Create dataset

Use multipart form:
```
POST /datasets/
form fields: name (text), file (csv file)
```
Response includes dataset `id` and `sha256`.

2) Create rule
```
POST /rules/
{
  "name": "Public summary",
  "fields": ["timestamp", "value"],
  "filters": [{"field":"value","op":"gt","value":10}],
  "aggregations": [],
  "obfuscation": {"dropPII": ["email"]},
  "ttl_minutes": 1440
}
```

3) Create stream
```
POST /streams/
{
  "name": "My Stream",
  "dataset_id": 1,
  "rule_id": 1,
  "status": "active",
  "expires_at": null
}
```

4) Generate token
```
POST /tokens/
{
  "stream_id": 1,
  "scope": ["read"],
  "expires_at": null,
  "one_time": false
}
```
Response: `{ id, stream_id, token, expires_at, one_time, revoked, created_at }`

5) Access preview (max 50 rows)
```
GET /streams/1/data?token=YOUR_TOKEN
```

6) Export full dataset
```
GET /streams/1/export?format=csv&token=YOUR_TOKEN
```
Or JSON:
```
GET /streams/1/export?format=json&token=YOUR_TOKEN
```

7) Generate consent receipt
```
GET /audit/1/receipt?format=html
GET /audit/1/receipt?format=pdf
```

Audit log shape
- type: string
- actor: "citizen" | "app" | "admin"
- message: string
- created_at: ISO timestamp
- meta: object

Notes
- Token validation is required for /streams/{id}/data and /streams/{id}/export.
- Token must match stream, not be revoked, and not be expired.
- When accessed with token, actor is recorded as "app" in audits.