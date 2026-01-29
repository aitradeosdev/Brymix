from celery import Celery
from config import settings
import json
from datetime import datetime
from app.database import SessionLocal, Job, ApiKey, ApiKey
from app.mt5_pool import mt5_pool
from app.rule_checker import RuleChecker
from app.webhook_client import WebhookClient
import logging
from urllib.parse import urlparse
import ipaddress

logger = logging.getLogger(__name__)

celery_app = Celery(
    "brymix",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

@celery_app.task(bind=True)
def process_challenge_check(self, job_id: str, job_data: dict):
    db = SessionLocal()
    
    try:
        # Update job status
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database")
            return
        
        job.status = "processing"
        db.commit()
        
        # Get MT5 terminal from pool
        terminal = None
        try:
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            terminal = loop.run_until_complete(mt5_pool.get_terminal())
            
            if not terminal:
                raise Exception("No available MT5 terminals")
            
            # Connect to MT5
            connected = loop.run_until_complete(
                mt5_pool.connect_terminal(
                    terminal,
                    job_data["mt5_login"],
                    job_data["mt5_password"],
                    job_data["mt5_server"]
                )
            )
            
            if not connected:
                raise Exception("Failed to connect to MT5")
            
            # Run rule checker
            from app.mt5_client import MT5Client
            from app.models import CheckRequest
            
            mt5_client = MT5Client(settings.mt5_path, settings.mt5_timeout)
            mt5_client.initialize()
            
            checker = RuleChecker(mt5_client)
            request = CheckRequest(**job_data)
            result = checker.check_challenge(request, job_id)
            
            # Convert to dict for storage
            result_dict = result.model_dump(mode='json')
            
            # Update job with result
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.result = json.dumps(result_dict)
            db.commit()
            
            # Send webhook if callback_url provided
            if job_data.get("callback_url"):
                if _is_safe_url(job_data["callback_url"]):
                    # Get webhook secret for this job's API key
                    api_key_obj = db.query(ApiKey).filter(
                        ApiKey.owner_email == job.api_key_owner,
                        ApiKey.active == True
                    ).first()
                    
                    if api_key_obj and api_key_obj.webhook_secret:
                        import asyncio
                        webhook_client = WebhookClient()
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(
                            webhook_client.send_result(
                                job_data["callback_url"], 
                                result_dict, 
                                api_key_obj.webhook_secret
                            )
                        )
                    else:
                        logger.warning(f"No webhook secret found for job {job_id}")
                else:
                    logger.warning(f"Blocked unsafe callback URL: {job_data['callback_url']}")
            
            return result_dict
            
        finally:
            if terminal:
                loop.run_until_complete(mt5_pool.release_terminal(terminal))
    
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        job.completed_at = datetime.utcnow()
        db.commit()
        raise
    
    finally:
        db.close()

def _is_safe_url(url: str) -> bool:
    """Validate URL to prevent SSRF attacks"""
    try:
        parsed = urlparse(url)
        
        # Only allow HTTP/HTTPS
        if parsed.scheme not in ['http', 'https']:
            return False
        
        # Block localhost and private IPs
        if parsed.hostname:
            try:
                ip = ipaddress.ip_address(parsed.hostname)
                if ip.is_private or ip.is_loopback:
                    return False
            except ValueError:
                # Not an IP, check hostname
                if parsed.hostname.lower() in ['localhost', '127.0.0.1', '::1']:
                    return False
        
        return True
    except Exception:
        return False