from __future__ import annotations
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

from sqlalchemy.orm import Session

from ..models.models import Stream, Token, Dataset, Audit
from ..core.config import DATA_DIR


def cleanup_expired(db: Session) -> Dict[str, Any]:
    now = datetime.utcnow()
    updated_streams = 0
    revoked_tokens = 0
    purged_files = 0

    # Expire streams past expires_at
    streams = db.query(Stream).all()
    for s in streams:
        if s.expires_at and s.expires_at < now and s.status != "expired":
            s.status = "expired"
            updated_streams += 1
            db.add(Audit(
                type="stream_expired",
                actor="system",
                message=f"Stream {s.id} auto-expired",
                stream_id=s.id,
                meta={"expires_at": s.expires_at.isoformat()},
                created_at=now,
            ))

    # Revoke tokens that are expired or whose stream is not active
    tokens = db.query(Token).all()
    for t in tokens:
        if t.revoked:
            continue
        # Consider token expired if past expires_at or stream expired
        related_stream = next((s for s in streams if s.id == t.stream_id), None)
        if (t.expires_at and t.expires_at < now) or (related_stream and related_stream.status != "active"):
            t.revoked = True
            revoked_tokens += 1
            db.add(Audit(
                type="token_revoked",
                actor="system",
                message=f"Token {t.id} auto-revoked",
                stream_id=t.stream_id,
                meta={"expires_at": t.expires_at.isoformat() if t.expires_at else None},
                created_at=now,
            ))

    db.commit()

    # Purge dataset files with no active streams
    datasets = db.query(Dataset).all()
    active_stream_dataset_ids = {s.dataset_id for s in streams if s.status == "active"}

    for d in datasets:
        if d.id in active_stream_dataset_ids:
            continue
        csv_path = DATA_DIR / f"{d.id}.csv"
        if csv_path.exists():
            try:
                csv_path.unlink()
                purged_files += 1
                db.add(Audit(
                    type="dataset_purged",
                    actor="system",
                    message=f"Dataset file for {d.id} purged (no active streams)",
                    stream_id=None,
                    meta={"datasetId": d.id, "path": str(csv_path)},
                    created_at=now,
                ))
            except Exception:
                # ignore failures silently for now
                pass

    db.commit()

    return {
        "expired_streams": updated_streams,
        "revoked_tokens": revoked_tokens,
        "purged_dataset_files": purged_files,
        "timestamp": now.isoformat(),
    }

