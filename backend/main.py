from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

import models, schemas, auth, database, security, ansible_runner
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Network Forensic Inventory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if any user already exists
    existing_any_user = db.query(models.User).first()
    if existing_any_user:
        # In a real app, you might only allow an admin to create other users
        # For this "single user" priority tool, we'll block new registrations if one exists
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is disabled as an admin user already exists."
        )

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/hosts", response_model=List[schemas.Host])
def get_hosts(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Host).all()

@app.post("/hosts", response_model=schemas.Host)
def create_host(host: schemas.HostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    host_data = host.dict()
    if host_data.get("ssh_password"):
        host_data["ssh_password"] = security.encrypt_data(host_data["ssh_password"])
    if host_data.get("ssh_key"):
        host_data["ssh_key"] = security.encrypt_data(host_data["ssh_key"])

    db_host = models.Host(**host_data)
    db.add(db_host)
    db.commit()
    db.refresh(db_host)
    return db_host

@app.delete("/hosts/{host_id}")
def delete_host(host_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    host = db.query(models.Host).filter(models.Host.id == host_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    db.delete(host)
    db.commit()
    return {"message": "Host deleted"}

@app.post("/hosts/{host_id}/scan")
async def trigger_scan(host_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    host = db.query(models.Host).filter(models.Host.id == host_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    background_tasks.add_task(ansible_runner.run_ansible_scan, host_id, db)
    return {"message": "Scan triggered successfully"}

@app.get("/hosts/{host_id}/scans", response_model=List[schemas.ScanResult])
def get_host_scans(host_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.ScanResult).filter(models.ScanResult.host_id == host_id).order_by(models.ScanResult.timestamp.desc()).all()

@app.get("/scans/{scan_id}", response_model=schemas.ScanResult)
def get_scan_result(scan_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    scan = db.query(models.ScanResult).filter(models.ScanResult.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "online", "message": "NFI API is running"}
