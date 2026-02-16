from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
import re

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class HostBase(BaseModel):
    hostname: str = Field(..., min_length=1, max_length=255)
    ip_address: str
    ssh_user: str = Field(..., min_length=1)

    @validator('ip_address')
    def validate_ip(cls, v):
        # Basic IPv4 and simple hostname validation
        ipv4_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        hostname_pattern = r'^[a-zA-Z0-9\.\-]+$'
        if not re.match(ipv4_pattern, v) and not re.match(hostname_pattern, v):
            raise ValueError('Must be a valid IP address or hostname')
        return v

class HostCreate(HostBase):
    ssh_password: Optional[str] = None
    ssh_key: Optional[str] = None

class HostUpdate(BaseModel):
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    ssh_user: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_key: Optional[str] = None

class Host(HostBase):
    id: int
    # We do NOT include ssh_password or ssh_key here to avoid leaking them to the frontend

    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    host: Host
    scan_id: Optional[int] = None
    match_type: str # 'host' or 'data'
    snippet: Optional[str] = None

class ScanResultBase(BaseModel):
    host_id: int
    data: Any
    status: str

class ScanResult(ScanResultBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
