from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models.models import Token, Audit
from ..schemas.schemas import TokenCreate, TokenRead
from ..services.tokens import create_token

router = APIRouter()


@router.get("/", response_model=List[TokenRead])
async def list_tokens(db: Session = Depends(get_db)):
    tokens = db.query(Token).order_by(Token.created_at.desc()).all()
    return tokens


@router.post("/", response_model=TokenRead)
async def issue_token(payload: TokenCreate, db: Session = Depends(get_db)):
    token = create_token(
        db,
        stream_id=payload.stream_id,
        scope=payload.scope or [],
        expires_at=payload.expires_at,
        one_time=bool(payload.one_time),
    )
    # Audit log
    audit = Audit(
        type="token_created",
        actor="citizen",
        message=f"Token issued for stream {payload.stream_id}",
        stream_id=payload.stream_id,
        meta={"tokenId": token.id},
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()
    return token


@router.post("/{token_id}/revoke")
async def revoke_token(token_id: int, db: Session = Depends(get_db)):
    token: Token | None = db.query(Token).filter(Token.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    token.revoked = True
    db.add(token)
    # Audit
    audit = Audit(
        type="token_revoked",
        actor="citizen",
        message=f"Token {token_id} revoked",
        stream_id=token.stream_id,
        meta={"tokenId": token.id},
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()
    return {"status": "revoked", "tokenId": token.id}