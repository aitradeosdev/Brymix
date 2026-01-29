from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import logging
from datetime import datetime
import json
import re
from pydantic import BaseModel

from app.models import CheckRequest, JobResponse, CheckResponse
from app.database import get_db, Job, ApiKey
from app.celery_worker import process_challenge_check
from app.rule_checker import RuleChecker
from app.mt5_client import MT5Client
from app.security import rate_limit_middleware, generate_secure_key, SecurityManager
from config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Brymix Propfirm Challenge Checker",
    description="API for validating propfirm trading challenges",
    version="2.0.0"
)

# Initialize security manager
security_manager = SecurityManager(settings.encryption_key)

# Legacy MT5 client for sync endpoint
mt5_client = MT5Client(settings.mt5_path, settings.mt5_timeout)

def verify_api_key(x_api_key: str, db: Session) -> ApiKey:
    if not x_api_key:
        return None
    api_key = db.query(ApiKey).filter(ApiKey.key == x_api_key, ApiKey.active == True).first()
    return api_key

def sanitize_for_log(value: str) -> str:
    """Sanitize string for safe logging"""
    if not isinstance(value, str):
        value = str(value)
    # Remove control characters and limit length
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    return sanitized[:100]  # Limit length

class RegisterRequest(BaseModel):
    name: str
    email: str
    company: str

class DashboardApiKeyRequest(BaseModel):
    email: str
    company: str
    name: str

class DeleteApiKeyRequest(BaseModel):
    api_key: str
    owner_email: str

@app.post("/api/v1/register")
async def register_propfirm(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new propfirm and generate API key"""
    import secrets
    
    # Generate secure API key and webhook secret
    api_key = generate_secure_key()
    webhook_secret = generate_secure_key()
    
    # Create API key record
    new_key = ApiKey(
        key=api_key,
        name=f"{request.company} - {request.name}",
        active=True,
        owner_email=request.email,
        company=request.company,
        webhook_secret=webhook_secret
    )
    db.add(new_key)
    db.commit()
    
    logger.info(f"New propfirm registered: {sanitize_for_log(request.company)}")
    
    return {
        "message": "Registration successful",
        "api_key": api_key,
        "company": request.company,
        "webhook_secret": webhook_secret,
        "api_url": "http://localhost:8000",
        "documentation": "/docs"
    }

@app.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Brymix Challenge Checker API", "version": "2.0.0"}

# Dashboard API endpoints
@app.post("/api/v1/dashboard/create-key")
async def create_dashboard_api_key(
    request: DashboardApiKeyRequest,
    db: Session = Depends(get_db)
):
    """Create API key for dashboard user"""
    try:
        logger.info(f"Creating API key for: {request.email}")
        api_key = generate_secure_key()
        webhook_secret = generate_secure_key()
        
        new_key = ApiKey(
            key=api_key,
            name=f"{request.company} - {request.name}",
            active=True,
            owner_email=request.email,
            company=request.company,
            webhook_secret=webhook_secret
        )
        
        logger.info(f"Adding API key to database")
        db.add(new_key)
        db.commit()
        
        logger.info(f"API key created successfully: {api_key[:12]}...")
        
        return {
            "api_key": api_key,
            "webhook_secret": webhook_secret,
            "company": request.company,
            "name": request.name,
            "created_at": new_key.created_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Dashboard API key creation failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/v1/dashboard/delete-key")
async def delete_dashboard_api_key(
    request: DeleteApiKeyRequest,
    db: Session = Depends(get_db)
):
    """Delete API key (dashboard only)"""
    api_key = db.query(ApiKey).filter(
        ApiKey.key == request.api_key,
        ApiKey.owner_email == request.owner_email,
        ApiKey.active == True
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found or unauthorized")
    
    api_key.active = False
    db.commit()
    
    logger.info(f"API key deleted for: {sanitize_for_log(request.owner_email)}")
    
    return {"message": "API key deleted successfully"}

@app.get("/api/v1/dashboard/keys/{owner_email}")
async def get_user_api_keys(
    owner_email: str,
    db: Session = Depends(get_db)
):
    """Get all API keys for a user"""
    try:
        logger.info(f"Getting API keys for: {owner_email}")
        keys = db.query(ApiKey).filter(
            ApiKey.owner_email == owner_email,
            ApiKey.active == True
        ).all()
        
        logger.info(f"Found {len(keys)} keys for {owner_email}")
        
        return {
            "keys": [
                {
                    "id": key.key,  # Return full API key
                    "key": f"{key.key[:12]}...{key.key[-4:]}",
                    "name": key.name,
                    "company": key.company,
                    "webhook_secret": key.webhook_secret,
                    "created_at": key.created_at.isoformat()
                }
                for key in keys
            ]
        }
    except Exception as e:
        logger.error(f"Get API keys failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

@app.post("/api/v1/check", response_model=JobResponse)
async def create_check(
    request: CheckRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Submit challenge check - queued processing"""
    api_key_obj = verify_api_key(x_api_key, db)
    if not api_key_obj:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    # Create job record with owner tracking
    job = Job(
        id=job_id,
        user_id=request.user_id,
        challenge_id=request.challenge_id,
        status="pending",
        api_key_owner=api_key_obj.owner_email
    )
    db.add(job)
    db.commit()
    
    # Queue Celery task with job_id
    process_challenge_check.delay(job_id, request.model_dump())
    
    logger.info(f"Queued job {job_id} for user {sanitize_for_log(request.user_id)}")
    
    return JobResponse(
        job_id=job_id,
        status="pending",
        message="Check queued successfully"
    )

@app.get("/api/v1/job/{job_id}")
async def get_job_status(
    job_id: str,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get job status"""
    api_key_obj = verify_api_key(x_api_key, db)
    if not api_key_obj:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Multi-tenant: only show jobs owned by this API key
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.api_key_owner == api_key_obj.owner_email
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "job_id": job.id,
        "status": job.status,
        "created_at": job.created_at.isoformat()
    }
    
    if job.completed_at:
        response["completed_at"] = job.completed_at.isoformat()
    
    if job.result:
        response["result"] = json.loads(job.result)
    
    if job.error_message:
        response["error"] = job.error_message
    
    return response

@app.post("/api/v1/check/sync", response_model=CheckResponse)
async def create_check_sync(
    request: CheckRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Synchronous check (legacy)"""
    api_key_obj = verify_api_key(x_api_key, db)
    if not api_key_obj:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    try:
        rule_checker = RuleChecker(mt5_client)
        result = rule_checker.check_challenge(request, job_id)
        return result
    except Exception as e:
        logger.error(f"Sync check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs")
async def list_jobs(
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """List recent jobs (multi-tenant)"""
    api_key_obj = verify_api_key(x_api_key, db)
    if not api_key_obj:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Multi-tenant: only show jobs owned by this API key
    jobs = db.query(Job).filter(
        Job.api_key_owner == api_key_obj.owner_email
    ).order_by(Job.created_at.desc()).limit(limit).all()
    
    return {
        "jobs": [
            {
                "id": job.id,
                "user_id": job.user_id,
                "challenge_id": job.challenge_id,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None
            }
            for job in jobs
        ]
    }

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("Starting Brymix Challenge Checker API v2.0")
    
    try:
        if not mt5_client.initialize():
            logger.warning("Failed to initialize MT5 - continuing without MT5")
        else:
            logger.info("MT5 initialized successfully")
    except Exception as e:
        logger.warning(f"MT5 startup failed: {str(e)} - continuing without MT5")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Brymix Challenge Checker API")
    mt5_client.shutdown()