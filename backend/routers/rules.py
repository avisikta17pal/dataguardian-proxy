from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from db import get_db
import models, schemas
from utils import log_audit_event, to_json_string, from_json_string

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("/", response_model=list[schemas.Rule])
def list_rules(db: Session = Depends(get_db)):
	rules = db.query(models.Rule).order_by(models.Rule.createdAt.desc()).all()
	return [
		schemas.Rule(
			id=r.id,
			name=r.name,
			datasetId=r.datasetId,
			fields=from_json_string(r.fields) if r.fields else None,
			filters=from_json_string(r.filters) if r.filters else None,
			aggregations=from_json_string(r.aggregations) if r.aggregations else None,
			obfuscation=from_json_string(r.obfuscation) if r.obfuscation else None,
			ttlMinutes=r.ttlMinutes,
			createdAt=r.createdAt,
		)
		for r in rules
	]


@router.post("/", response_model=schemas.Rule)
def create_rule(payload: schemas.RuleCreate, db: Session = Depends(get_db)):
	# Validate dataset exists
	dataset = db.query(models.Dataset).filter(models.Dataset.id == payload.datasetId).first()
	if not dataset:
		raise HTTPException(status_code=400, detail="Dataset not found")

	created_at = payload.createdAt or datetime.utcnow()
	rule = models.Rule(
		name=payload.name,
		datasetId=payload.datasetId,
		fields=to_json_string(payload.fields) if payload.fields is not None else None,
		filters=to_json_string(payload.filters) if payload.filters is not None else None,
		aggregations=to_json_string(payload.aggregations) if payload.aggregations is not None else None,
		obfuscation=to_json_string(payload.obfuscation) if payload.obfuscation is not None else None,
		ttlMinutes=payload.ttlMinutes,
		createdAt=created_at,
	)
	db.add(rule)
	db.commit()
	db.refresh(rule)

	log_audit_event(db, event_type="rule.create", actor="citizen", message=f"Rule {rule.name} created (id={rule.id}) for dataset {dataset.id}")

	return schemas.Rule(
		id=rule.id,
		name=rule.name,
		datasetId=rule.datasetId,
		fields=from_json_string(rule.fields) if rule.fields else None,
		filters=from_json_string(rule.filters) if rule.filters else None,
		aggregations=from_json_string(rule.aggregations) if rule.aggregations else None,
		obfuscation=from_json_string(rule.obfuscation) if rule.obfuscation else None,
		ttlMinutes=rule.ttlMinutes,
		createdAt=rule.createdAt,
	)