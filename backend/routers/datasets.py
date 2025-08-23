from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import json

from db import get_db
import models, schemas
from utils import log_audit_event, to_json_string, from_json_string, dataset_csv_path, save_upload_to_path

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
def create_dataset(
	name: str = Form(...),
	schema: str = Form(...),
	sha256: str = Form(...),
	file: UploadFile = File(...),
	db: Session = Depends(get_db),
):
	# schema comes as JSON string in multipart; parse and re-dump to normalize
	try:
		schema_json = json.loads(schema)
	except Exception:
		schema_json = None
	created_at = datetime.utcnow()
	dataset = models.Dataset(
		name=name,
		schema=to_json_string(schema_json),
		sha256=sha256,
		createdAt=created_at,
	)
	db.add(dataset)
	db.commit()
	db.refresh(dataset)

	# Save uploaded CSV to backend/data/{dataset_id}.csv
	csv_path = dataset_csv_path(dataset.id)
	save_upload_to_path(file, csv_path)

	log_audit_event(db, event_type="dataset.upload", actor="citizen", message=f"Dataset {dataset.name} created (id={dataset.id}) and file saved")

	return schemas.Dataset(
		id=dataset.id,
		name=dataset.name,
		schema=schema_json,
		sha256=dataset.sha256,
		createdAt=dataset.createdAt,
	)