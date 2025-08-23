from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models.models import Stream, Dataset, Rule, Token, Audit
from ..schemas.schemas import AuditRead
from ..utils.utils import render_receipt_html, render_receipt_pdf

router = APIRouter()


@router.get("/audit/{stream_id}/receipt")
async def get_consent_receipt(
    stream_id: int,
    format: str = Query(default="html", pattern="^(html|pdf)$"),
    db: Session = Depends(get_db),
):
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    dataset: Dataset | None = stream.dataset
    if not dataset:
        raise HTTPException(status_code=400, detail="Stream has no dataset")

    rule: Rule | None = stream.rule

    tokens: List[Token] = db.query(Token).filter(Token.stream_id == stream.id).all()
    audits: List[Audit] = db.query(Audit).filter(Audit.stream_id == stream.id).order_by(Audit.created_at.asc()).all()

    # Build context
    context: Dict[str, Any] = {
        "dataset": {
            "id": dataset.id,
            "name": dataset.name,
            "sha256": dataset.sha256,
        },
        "rule": {
            "id": rule.id if rule else None,
            "name": rule.name if rule else None,
            "fields": rule.fields if rule else None,
            "filters": rule.filters if rule else None,
            "aggregations": rule.aggregations if rule else None,
            "obfuscation": rule.obfuscation if rule else None,
            "ttlMinutes": rule.ttl_minutes if rule else None,
        },
        "stream": {
            "id": stream.id,
            "name": stream.name,
            "status": stream.status,
            "expiresAt": stream.expires_at,
        },
        "tokens": [
            {
                "id": t.id,
                "token": t.token,
                "scope": t.scope,
                "expiresAt": t.expires_at,
                "oneTime": t.one_time,
                "revoked": t.revoked,
                "createdAt": t.created_at,
            }
            for t in tokens
        ],
        "audits": [
            {
                "id": a.id,
                "type": a.type,
                "actor": a.actor,
                "message": a.message,
                "createdAt": a.created_at,
                "meta": a.meta,
            }
            for a in audits
        ],
        "generatedAt": datetime.utcnow(),
    }

    # Log generation
    audit = Audit(
        type="consent_receipt_generated",
        actor="citizen",
        message=f"Consent receipt generated as {format}",
        stream_id=stream.id,
        meta=None,
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    if format == "pdf":
        pdf_bytes = render_receipt_pdf(context)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=consent_receipt_stream_{stream.id}.pdf"})

    html = render_receipt_html(context)
    return HTMLResponse(content=html)