from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from db import get_db
import models, schemas
from utils import log_audit_event, load_dataset_df, apply_rule_filters, apply_rule_aggregations, apply_rule_obfuscation, from_json_string

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
	stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
	if not stream:
		raise HTTPException(status_code=404, detail="Stream not found")
	# Load rule
	rule = db.query(models.Rule).filter(models.Rule.id == stream.ruleId).first()
	if not rule:
		raise HTTPException(status_code=404, detail="Rule not found for stream")

	# Load dataset CSV
	try:
		df = load_dataset_df(stream.datasetId)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Dataset file not found")
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

	# Keep only selected fields if provided
	fields = from_json_string(rule.fields) if rule.fields else None
	if isinstance(fields, list) and fields:
		keep_cols = [c for c in fields if c in df.columns]
		if keep_cols:
			df = df[keep_cols]

	# Apply filters
	filters = from_json_string(rule.filters) if rule.filters else None
	df = apply_rule_filters(df, filters)

	# Apply aggregations
	aggregations = from_json_string(rule.aggregations) if rule.aggregations else None
	df = apply_rule_aggregations(df, aggregations)

	# Apply obfuscation
	obfuscation = from_json_string(rule.obfuscation) if rule.obfuscation else None
	df = apply_rule_obfuscation(df, obfuscation)

	# Limit preview rows to 50
	df_preview = df.head(50)
	columns = list(df_preview.columns)
	rows = df_preview.to_dict(orient="records")

	log_audit_event(db, event_type="stream_data_accessed", actor="app", message=f"Data preview accessed for stream {stream_id}")

	return {
		"streamId": stream.id,
		"expiresAt": stream.expiresAt,
		"status": stream.status,
		"columns": columns,
		"rows": rows,
	}