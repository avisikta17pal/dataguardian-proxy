from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models.models import Stream, Token
from ..schemas.schemas import TokenCreate, TokenRead

router = APIRouter()


@router.post("/", response_model=TokenRead)
async def create_token(payload: TokenCreate, db: Session = Depends(get_db)):
    stream: Stream | None = db.query(Stream).filter(Stream.id == payload.stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    token_value = secrets.token_urlsafe(24)
    token = Token(
        stream_id=stream.id,
        token=token_value,
        scope=payload.scope,
        expires_at=payload.expires_at,
        one_time=bool(payload.one_time),
        revoked=False,
        created_at=datetime.utcnow(),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token