# Backend API

API paths:
- POST /datasets/
- GET /streams/{id}/data?token=...
- GET /streams/{id}/export?format=csv|json&token=...
- POST /tokens/
- GET /audit/{id}/receipt?format=html|pdf

## Example Flow

1. Create dataset

```bash
curl -F name=mydata -F file=@/path/to/data.csv http://localhost:8000/datasets/
```

2. Create rule

```bash
curl -X POST http://localhost:8000/rules/ -H 'Content-Type: application/json' -d '{
  "name": "demo",
  "fields": ["col1", "col2"],
  "filters": [{"field":"col1","op":"gt","value":10}]
}'
```

3. Create stream

```bash
curl -X POST http://localhost:8000/streams/ -H 'Content-Type: application/json' -d '{
  "name": "stream1",
  "dataset_id": 1,
  "rule_id": 1
}'
```

4. Issue token

```bash
curl -X POST http://localhost:8000/tokens/ -H 'Content-Type: application/json' -d '{
  "stream_id": 1,
  "expires_at": null,
  "one_time": false
}'
```

5. Preview data (50 rows max)

```bash
curl "http://localhost:8000/streams/1/data?token=YOUR_TOKEN"
```

6. Export CSV/JSON

```bash
curl -OJ "http://localhost:8000/streams/1/export?format=csv&token=YOUR_TOKEN"
```

```bash
curl "http://localhost:8000/streams/1/export?format=json&token=YOUR_TOKEN"
```

7. Consent receipt

```bash
curl -OJ "http://localhost:8000/audit/1/receipt?format=pdf"
```
