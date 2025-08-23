from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from ..core.db import Base


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    schema = Column(JSON, nullable=True)
    sha256 = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    streams = relationship("Stream", back_populates="dataset")


class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    fields = Column(JSON, nullable=True)
    filters = Column(JSON, nullable=True)
    aggregations = Column(JSON, nullable=True)
    obfuscation = Column(JSON, nullable=True)
    ttl_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    streams = relationship("Stream", back_populates="rule")


class Stream(Base):
    __tablename__ = "streams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True)
    status = Column(String, default="active", nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="streams")
    rule = relationship("Rule", back_populates="streams")
    tokens = relationship("Token", back_populates="stream")


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    actor = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    stream_id = Column(Integer, ForeignKey("streams.id"), nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("streams.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    scope = Column(JSON, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    one_time = Column(Boolean, default=False, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    stream = relationship("Stream", back_populates="tokens")