from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DatasetCreate(BaseModel):
    name: str
    schema: Optional[Dict[str, Any]] = None


class DatasetRead(BaseModel):
    id: int
    name: str
    schema: Optional[Dict[str, Any]]
    sha256: str
    created_at: datetime

    class Config:
        from_attributes = True


class RuleCreate(BaseModel):
    name: str
    fields: Optional[List[str]] = None
    filters: Optional[List[Dict[str, Any]]] = None
    aggregations: Optional[List[Dict[str, Any]]] = None
    obfuscation: Optional[Dict[str, Any]] = None


class RuleRead(BaseModel):
    id: int
    name: str
    fields: Optional[List[str]]
    filters: Optional[List[Dict[str, Any]]]
    aggregations: Optional[List[Dict[str, Any]]]
    obfuscation: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class StreamCreate(BaseModel):
    name: str
    dataset_id: int
    rule_id: Optional[int] = None
    status: Optional[str] = "active"
    expires_at: Optional[datetime] = None


class StreamRead(BaseModel):
    id: int
    name: str
    dataset_id: int
    rule_id: Optional[int]
    status: str
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class StreamDataPreview(BaseModel):
    streamId: int
    expiresAt: Optional[datetime]
    status: str
    columns: List[str]
    rows: List[Dict[str, Any]]