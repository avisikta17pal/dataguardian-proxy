from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


# Dataset
class DatasetCreate(BaseModel):
	name: str
	schema: Any
	sha256: str
	createdAt: Optional[datetime] = None


class Dataset(BaseModel):
	id: int
	name: str
	schema: Any
	sha256: str
	createdAt: datetime

	class Config:
		from_attributes = True


# Rule
class RuleCreate(BaseModel):
	name: str
	datasetId: int
	fields: Optional[Any] = None
	filters: Optional[Any] = None
	aggregations: Optional[Any] = None
	obfuscation: Optional[Any] = None
	ttlMinutes: Optional[int] = None
	createdAt: Optional[datetime] = None


class Rule(BaseModel):
	id: int
	name: str
	datasetId: int
	fields: Optional[Any] = None
	filters: Optional[Any] = None
	aggregations: Optional[Any] = None
	obfuscation: Optional[Any] = None
	ttlMinutes: Optional[int] = None
	createdAt: datetime

	class Config:
		from_attributes = True


# Stream
class StreamCreate(BaseModel):
	ruleId: int
	datasetId: int
	name: str
	status: Optional[str] = "active"
	expiresAt: Optional[datetime] = None
	createdAt: Optional[datetime] = None


class Stream(BaseModel):
	id: int
	ruleId: int
	datasetId: int
	name: str
	status: str
	expiresAt: Optional[datetime] = None
	createdAt: datetime

	class Config:
		from_attributes = True


# Token
class TokenCreate(BaseModel):
	streamId: int
	scope: Optional[str] = None
	expiresAt: Optional[datetime] = None
	oneTime: bool = False


class Token(BaseModel):
	id: int
	streamId: int
	token: str
	scope: Optional[str] = None
	expiresAt: Optional[datetime] = None
	oneTime: bool
	revoked: bool
	createdAt: datetime

	class Config:
		from_attributes = True


# Audit
class Audit(BaseModel):
	id: int
	type: str
	actor: str
	message: str
	createdAt: datetime

	class Config:
		from_attributes = True