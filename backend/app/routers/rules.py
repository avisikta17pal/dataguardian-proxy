from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..models.models import Rule, Dataset, Audit
from ..schemas.schemas import RuleCreate, RuleRead

router = APIRouter()


@router.get("/", response_model=List[RuleRead])
async def list_rules(db: Session = Depends(get_db)):
    rules = db.query(Rule).order_by(Rule.created_at.desc()).all()
    return rules


@router.post("/", response_model=RuleRead)
async def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    # Dataset linkage optional in current model; skip validation here
    rule = Rule(
        name=payload.name,
        fields=payload.fields,
        filters=payload.filters,
        aggregations=payload.aggregations,
        obfuscation=payload.obfuscation,
        ttl_minutes=payload.ttl_minutes,
        created_at=datetime.utcnow(),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    audit = Audit(
        type="rule_created",
        actor="citizen",
        message=f"Rule {rule.id} created",
        stream_id=None,
        meta=None,
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return rule