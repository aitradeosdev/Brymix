import hmac
import hashlib
from fastapi import Request, HTTPException
from config import settings
import logging

logger = logging.getLogger(__name__)

class WebhookHandler:
    @staticmethod
    async def verify_signature(request: Request) -> bool:
        """Verify HMAC-SHA256 signature from incoming webhook"""
        signature = request.headers.get("X-Signature")
        
        if not signature:
            logger.warning("No signature provided in request")
            return False
        
        # Get raw body
        body = await request.body()
        body_str = body.decode()
        
        # Calculate expected signature
        expected_signature = hmac.new(
            settings.webhook_secret.encode(),
            body_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        if hmac.compare_digest(signature, expected_signature):
            logger.info("Signature verified successfully")
            return True
        else:
            logger.warning("Signature verification failed")
            return False
    
    @staticmethod
    def verify_api_key(api_key: str) -> bool:
        """Verify API key (basic implementation for now)"""
        # TODO: Implement proper API key validation from database
        # For now, just check if key exists
        if not api_key:
            return False
        return True
