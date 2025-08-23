from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from db import Base


class Dataset(Base):
	__tablename__ = "datasets"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(255), nullable=False)
	schema = Column(Text, nullable=False)  # JSON as string
	sha256 = Column(String(64), nullable=False)
	createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

	rules = relationship("Rule", back_populates="dataset", cascade="all, delete-orphan")
	streams = relationship("Stream", back_populates="dataset", cascade="all, delete-orphan")


class Rule(Base):
	__tablename__ = "rules"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(255), nullable=False)
	datasetId = Column(Integer, ForeignKey("datasets.id"), nullable=False)
	fields = Column(Text, nullable=True)  # JSON as string
	filters = Column(Text, nullable=True)  # JSON as string
	aggregations = Column(Text, nullable=True)  # JSON as string
	obfuscation = Column(Text, nullable=True)  # JSON as string
	ttlMinutes = Column(Integer, nullable=True)
	createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

	dataset = relationship("Dataset", back_populates="rules")
	streams = relationship("Stream", back_populates="rule", cascade="all, delete-orphan")


class Stream(Base):
	__tablename__ = "streams"

	id = Column(Integer, primary_key=True, index=True)
	ruleId = Column(Integer, ForeignKey("rules.id"), nullable=False)
	datasetId = Column(Integer, ForeignKey("datasets.id"), nullable=False)
	name = Column(String(255), nullable=False)
	status = Column(String(32), default="active", nullable=False)  # active/expired/revoked
	expiresAt = Column(DateTime, nullable=True)
	createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

	rule = relationship("Rule", back_populates="streams")
	dataset = relationship("Dataset", back_populates="streams")
	tokens = relationship("Token", back_populates="stream", cascade="all, delete-orphan")


class Token(Base):
	__tablename__ = "tokens"

	id = Column(Integer, primary_key=True, index=True)
	streamId = Column(Integer, ForeignKey("streams.id"), nullable=False)
	token = Column(String(255), nullable=False, index=True)
	scope = Column(String(255), nullable=True)
	expiresAt = Column(DateTime, nullable=True)
	oneTime = Column(Boolean, default=False, nullable=False)
	revoked = Column(Boolean, default=False, nullable=False)
	createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

	stream = relationship("Stream", back_populates="tokens")


class Audit(Base):
	__tablename__ = "audit"

	id = Column(Integer, primary_key=True, index=True)
	type = Column(String(255), nullable=False)
	actor = Column(String(64), nullable=False)
	message = Column(Text, nullable=False)
	createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)