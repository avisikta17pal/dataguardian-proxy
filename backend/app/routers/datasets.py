from datetime import datetime
import hashlib
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
import pandas as pd
from ..core.db import get_db
from ..core.config import DATA_DIR
from ..models.models import Dataset
from ..schemas.schemas import DatasetRead

router = APIRouter()


@router.post("/", response_model=DatasetRead)
async def create_dataset(
    name: str = Form(...),
    file: UploadFile = File(...),
    schema: str | None = Form(None),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    # compute sha256
    sha256 = hashlib.sha256(content).hexdigest()

    # basic validation with pandas
    try:
        # Attempt to parse to ensure valid CSV
        pd.read_csv(pd.io.common.BytesIO(content), nrows=1)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {exc}")

    dataset = Dataset(name=name, schema=None, sha256=sha256, created_at=datetime.utcnow())
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Save CSV to data directory as {id}.csv
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    dest_path = DATA_DIR / f"{dataset.id}.csv"
    with open(dest_path, "wb") as f:
        f.write(content)

    return dataset