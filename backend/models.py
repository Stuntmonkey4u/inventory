from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

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
    data = Column(JSON) # Stores the raw forensic data
    status = Column(String) # 'success', 'failed'

    host = relationship("Host", back_populates="scans")
