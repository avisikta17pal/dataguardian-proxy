import json
from datetime import datetime
from typing import Any, Dict
from sqlalchemy.orm import Session

from . import models


def to_json_string(value: Any) -> str:
	return json.dumps(value) if value is not None else json.dumps(None)


def from_json_string(value: str) -> Any:
	try:
		return json.loads(value)
	except Exception:
		return None


def log_audit_event(db: Session, event_type: str, actor: str, message: str) -> models.Audit:
	audit = models.Audit(
		type=event_type,
		actor=actor,
		message=message,
		createdAt=datetime.utcnow(),
	)
	db.add(audit)
	db.commit()
	db.refresh(audit)
	return audit