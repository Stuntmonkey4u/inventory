from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

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
    hostname: str
    ip_address: str
    ssh_user: str

class HostCreate(HostBase):
    ssh_password: Optional[str] = None
    ssh_key: Optional[str] = None

class Host(HostBase):
    id: int

    class Config:
        from_attributes = True

class ScanResultBase(BaseModel):
    host_id: int
    data: Any
    status: str

class ScanResult(ScanResultBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
