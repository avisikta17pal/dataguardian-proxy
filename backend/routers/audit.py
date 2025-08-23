from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
import models, schemas

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/", response_model=list[schemas.Audit])
def list_audit(db: Session = Depends(get_db)):
	audit_events = db.query(models.Audit).order_by(models.Audit.createdAt.desc()).all()
	return [
		schemas.Audit(
			id=a.id,
			type=a.type,
			actor=a.actor,
			message=a.message,
			createdAt=a.createdAt,
		)
		for a in audit_events
	]