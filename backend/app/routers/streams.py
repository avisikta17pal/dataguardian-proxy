from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from fastapi.responses import StreamingResponse
import io

from ..core.db import get_db
from ..core.config import DATA_DIR
from ..models.models import Stream, Dataset, Rule, Audit
from ..schemas.schemas import StreamDataPreview
from ..services.data_processing import (
    apply_filters,
    apply_aggregations,
    apply_obfuscation,
    select_fields,
)

router = APIRouter()


@router.get("/{stream_id}/data", response_model=StreamDataPreview)
async def get_stream_data(stream_id: int, db: Session = Depends(get_db)):
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    dataset: Dataset | None = stream.dataset
    if not dataset:
        raise HTTPException(status_code=400, detail="Stream has no dataset")

    csv_path = DATA_DIR / f"{dataset.id}.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")

    # Load dataset with pandas
    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {exc}")

    rule: Rule | None = stream.rule

    # Apply rule steps
    if rule and rule.filters:
        df = apply_filters(df, rule.filters)

    if rule and rule.fields:
        df = select_fields(df, rule.fields)

    if rule and rule.aggregations:
        df = apply_aggregations(df, rule.aggregations)

    if rule and rule.obfuscation:
        df = apply_obfuscation(df, rule.obfuscation)

    # Limit preview to max 50 rows
    df_preview = df.head(50)

    # Build response
    columns = [str(c) for c in df_preview.columns]
    rows: List[Dict[str, Any]] = df_preview.to_dict(orient="records")

    preview = StreamDataPreview(
        streamId=stream.id,
        expiresAt=stream.expires_at,
        status=stream.status,
        columns=columns,
        rows=rows,
    )

    # Audit logging
    audit = Audit(
        action="stream_data_accessed",
        stream_id=stream.id,
        metadata={
            "rowCount": len(rows),
            "columns": columns,
            "datasetId": dataset.id,
            "timestamp": datetime.utcnow().isoformat(),
        },
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return preview


@router.get("/{stream_id}/export")
async def export_stream(stream_id: int, format: str = "csv", db: Session = Depends(get_db)):
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    dataset: Dataset | None = stream.dataset
    if not dataset:
        raise HTTPException(status_code=400, detail="Stream has no dataset")

    csv_path = DATA_DIR / f"{dataset.id}.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")

    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {exc}")

    rule: Rule | None = stream.rule
    if rule and rule.filters:
        df = apply_filters(df, rule.filters)
    if rule and rule.fields:
        df = select_fields(df, rule.fields)
    if rule and rule.aggregations:
        df = apply_aggregations(df, rule.aggregations)
    if rule and rule.obfuscation:
        df = apply_obfuscation(df, rule.obfuscation)

    fmt = (format or "csv").lower()
    # Audit logging for export
    audit = Audit(
        action="stream_exported",
        stream_id=stream.id,
        metadata={
            "message": f"Stream {stream_id} exported as {fmt}",
            "actor": "citizen",
            "format": fmt,
            "rowCount": int(len(df)),
            "datasetId": dataset.id,
            "timestamp": datetime.utcnow().isoformat(),
        },
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    if fmt == "json":
        return df.to_dict(orient="records")

    # default: csv
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    filename = f"stream_{stream_id}.csv"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}",
    }
    return StreamingResponse(iter([csv_bytes]), media_type="text/csv", headers=headers)