import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
import models, schemas
from utils import log_audit_event

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/", response_model=list[schemas.Token])
def list_tokens(db: Session = Depends(get_db)):
	tokens = db.query(models.Token).order_by(models.Token.createdAt.desc()).all()
	return [
		schemas.Token(
			id=t.id,
			streamId=t.streamId,
			token=t.token,
			scope=t.scope,
			expiresAt=t.expiresAt,
			oneTime=t.oneTime,
			revoked=t.revoked,
			createdAt=t.createdAt,
		)
		for t in tokens
	]


@router.post("/", response_model=schemas.Token)
def create_token(payload: schemas.TokenCreate, db: Session = Depends(get_db)):
	stream = db.query(models.Stream).filter(models.Stream.id == payload.streamId).first()
	if not stream:
		raise HTTPException(status_code=400, detail="Stream not found")

	raw_token = secrets.token_urlsafe(24)
	token = models.Token(
		streamId=payload.streamId,
		token=raw_token,
		scope=payload.scope,
		expiresAt=payload.expiresAt,
		oneTime=payload.oneTime,
		createdAt=datetime.utcnow(),
	)
	db.add(token)
	db.commit()
	db.refresh(token)

	log_audit_event(db, event_type="token.create", actor="app", message=f"Token created for stream {payload.streamId} (id={token.id})")

	return schemas.Token(
		id=token.id,
		streamId=token.streamId,
		token=token.token,
		scope=token.scope,
		expiresAt=token.expiresAt,
		oneTime=token.oneTime,
		revoked=token.revoked,
		createdAt=token.createdAt,
	)


@router.post("/{token_id}/revoke", response_model=schemas.Token)
def revoke_token(token_id: int, db: Session = Depends(get_db)):
	token = db.query(models.Token).filter(models.Token.id == token_id).first()
	if not token:
		raise HTTPException(status_code=404, detail="Token not found")
	if token.revoked:
		return schemas.Token(
			id=token.id,
			streamId=token.streamId,
			token=token.token,
			scope=token.scope,
			expiresAt=token.expiresAt,
			oneTime=token.oneTime,
			revoked=token.revoked,
			createdAt=token.createdAt,
		)

	token.revoked = True
	db.commit()
	db.refresh(token)

	log_audit_event(db, event_type="token.revoke", actor="app", message=f"Token revoked (id={token.id})")

	return schemas.Token(
		id=token.id,
		streamId=token.streamId,
		token=token.token,
		scope=token.scope,
		expiresAt=token.expiresAt,
		oneTime=token.oneTime,
		revoked=token.revoked,
		createdAt=token.createdAt,
	)