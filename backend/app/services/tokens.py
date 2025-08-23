from __future__ import annotations
from datetime import datetime
import secrets
from sqlalchemy.orm import Session
from ..models.models import Token, Stream
from fastapi import HTTPException


def generate_token_string(length: int = 32) -> str:
    # URL-safe token
    return secrets.token_urlsafe(length)


def create_token(
    db: Session,
    stream_id: int,
    scope: list[str] | None,
    expires_at: datetime | None,
    one_time: bool = False,
) -> Token:
    # Ensure stream exists
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Generate unique token string
    for _ in range(5):
        token_str = generate_token_string(24)
        existing = db.query(Token).filter(Token.token == token_str).first()
        if not existing:
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique token")

    token = Token(
        stream_id=stream_id,
        token=token_str,
        scope=scope or [],
        expires_at=expires_at,
        one_time=one_time,
        revoked=False,
        created_at=datetime.utcnow(),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def validate_stream_token(db: Session, stream_id: int, token_value: str) -> Token:
    token: Token | None = db.query(Token).filter(Token.token == token_value).first()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    if token.stream_id != stream_id:
        raise HTTPException(status_code=401, detail="Token does not match stream")

    if token.revoked:
        raise HTTPException(status_code=401, detail="Token revoked")

    if token.expires_at and token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired")

    # Ensure stream is active and not expired
    stream: Stream | None = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    if stream.status in ("expired", "revoked"):
        raise HTTPException(status_code=401, detail="Stream is not active")
    if stream.expires_at and stream.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Stream expired")

    return token