from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from db import get_db
import models, schemas
from utils import log_audit_event

router = APIRouter(prefix="/streams", tags=["streams"])


@router.get("/", response_model=list[schemas.Stream])
def list_streams(db: Session = Depends(get_db)):
	streams = db.query(models.Stream).order_by(models.Stream.createdAt.desc()).all()
	return [
		schemas.Stream(
			id=s.id,
			ruleId=s.ruleId,
			datasetId=s.datasetId,
			name=s.name,
			status=s.status,
			expiresAt=s.expiresAt,
			createdAt=s.createdAt,
		)
		for s in streams
	]


@router.post("/", response_model=schemas.Stream)
def create_stream(payload: schemas.StreamCreate, db: Session = Depends(get_db)):
	# Validate rule and dataset
	rule = db.query(models.Rule).filter(models.Rule.id == payload.ruleId).first()
	if not rule:
		raise HTTPException(status_code=400, detail="Rule not found")
	dataset = db.query(models.Dataset).filter(models.Dataset.id == payload.datasetId).first()
	if not dataset:
		raise HTTPException(status_code=400, detail="Dataset not found")

	created_at = payload.createdAt or datetime.utcnow()
	stream = models.Stream(
		ruleId=payload.ruleId,
		datasetId=payload.datasetId,
		name=payload.name,
		status=payload.status or "active",
		expiresAt=payload.expiresAt,
		createdAt=created_at,
	)
	db.add(stream)
	db.commit()
	db.refresh(stream)

	log_audit_event(db, event_type="stream.create", actor="citizen", message=f"Stream {stream.name} created (id={stream.id}) for rule {rule.id}")

	return schemas.Stream(
		id=stream.id,
		ruleId=stream.ruleId,
		datasetId=stream.datasetId,
		name=stream.name,
		status=stream.status,
		expiresAt=stream.expiresAt,
		createdAt=stream.createdAt,
	)


@router.get("/{stream_id}/data")
def preview_stream_data(stream_id: int, db: Session = Depends(get_db)):
	# Stub: return fake JSON table
	stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
	if not stream:
		raise HTTPException(status_code=404, detail="Stream not found")

	log_audit_event(db, event_type="stream.preview", actor="app", message=f"Preview requested for stream {stream_id}")

	fake_rows = [
		{"id": 1, "name": "Alice", "age": 34},
		{"id": 2, "name": "Bob", "age": 29},
		{"id": 3, "name": "Charlie", "age": 41},
	]
	return {"columns": ["id", "name", "age"], "rows": fake_rows}