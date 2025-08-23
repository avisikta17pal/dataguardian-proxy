from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
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

    streams = relationship("Stream", back_populates="rule")


class Stream(Base):
    __tablename__ = "streams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True)
    status = Column(String, default="active", nullable=False)
    expires_at = Column(DateTime, nullable=True)

    dataset = relationship("Dataset", back_populates="streams")
    rule = relationship("Rule", back_populates="streams")


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    stream_id = Column(Integer, ForeignKey("streams.id"), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)