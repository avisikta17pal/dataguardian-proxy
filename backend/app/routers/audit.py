from __future__ import annotations
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models.models import Audit, Stream, Dataset, Rule, Token
from ..schemas.schemas import AuditRead
from ..utils.receipts import render_receipt_html, generate_receipt_pdf
from ..services.cleanup import cleanup_expired

router = APIRouter()


@router.get("/")
async def list_audit(db: Session = Depends(get_db)):
    events: List[Audit] = db.query(Audit).order_by(Audit.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "type": e.type,
            "actor": e.actor,
            "message": e.message,
            "createdAt": e.created_at.isoformat(),
            "meta": e.meta,
        }
        for e in events
    ]


@router.get("/{stream_id}/receipt")
async def consent_receipt(
    stream_id: int,
    format: str = Query(default="html", pattern="^(html|pdf)$"),
    db: Session = Depends(get_db),
):
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    dataset: Dataset | None = stream.dataset
    rule: Rule | None = stream.rule
    tokens: List[Token] = db.query(Token).filter(Token.stream_id == stream_id).all()
    events: List[Audit] = db.query(Audit).filter(Audit.stream_id == stream_id).order_by(Audit.created_at.asc()).all()

    html = render_receipt_html(stream=stream, dataset=dataset, rule=rule, tokens=tokens, events=events)

    # Audit log for receipt generation
    audit = Audit(
        type="consent_receipt_generated",
        actor="citizen",
        message=f"Consent receipt generated for stream {stream_id}",
        stream_id=stream_id,
        meta={"format": format},
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    if format == "pdf":
        pdf_bytes = generate_receipt_pdf(stream=stream, dataset=dataset, rule=rule, tokens=tokens, events=events)
        filename = f"consent_receipt_stream_{stream_id}.pdf"
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    return HTMLResponse(content=html)


@router.post("/maintenance/cleanup")
async def force_cleanup(db: Session = Depends(get_db)):
    result = cleanup_expired(db)
    return result