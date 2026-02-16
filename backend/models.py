from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.dialects.postgresql import JSONB

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class Host(Base):
    __tablename__ = "hosts"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String, index=True)
    ssh_user = Column(String)
    ssh_password = Column(String, nullable=True) # Should be encrypted in a real app
    ssh_key = Column(String, nullable=True)     # Should be encrypted in a real app

    scans = relationship("ScanResult", back_populates="host")

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # Use JSONB for Postgres, fallback to JSON for others (SQLite)
    data = Column(JSON().with_variant(JSONB, "postgresql"))
    status = Column(String) # 'success', 'failed'

    host = relationship("Host", back_populates="scans")

# Index for searching JSON data (Postgres only)
Index('ix_scan_results_data_gin', ScanResult.data, postgresql_using='gin')
