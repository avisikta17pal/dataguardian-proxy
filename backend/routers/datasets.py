from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from db import get_db
import models, schemas
from utils import log_audit_event, to_json_string, from_json_string

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/", response_model=list[schemas.Dataset])
def list_datasets(db: Session = Depends(get_db)):
	datasets = db.query(models.Dataset).order_by(models.Dataset.createdAt.desc()).all()
	# convert schema from string to JSON
	for d in datasets:
		# no-op if not valid
		pass
	return [
		schemas.Dataset(
			id=d.id,
			name=d.name,
			schema=from_json_string(d.schema),
			sha256=d.sha256,
			createdAt=d.createdAt,
		)
		for d in datasets
	]


@router.post("/", response_model=schemas.Dataset)
def create_dataset(payload: schemas.DatasetCreate, db: Session = Depends(get_db)):
	created_at = payload.createdAt or datetime.utcnow()
	dataset = models.Dataset(
		name=payload.name,
		schema=to_json_string(payload.schema),
		sha256=payload.sha256,
		createdAt=created_at,
	)
	db.add(dataset)
	db.commit()
	db.refresh(dataset)

	log_audit_event(db, event_type="dataset.upload", actor="citizen", message=f"Dataset {dataset.name} created (id={dataset.id})")

	return schemas.Dataset(
		id=dataset.id,
		name=dataset.name,
		schema=from_json_string(dataset.schema),
		sha256=dataset.sha256,
		createdAt=dataset.createdAt,
	)