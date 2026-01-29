import httpx
import hmac
import hashlib
import json
from app.models import CheckResponse
from config import settings
import logging

logger = logging.getLogger(__name__)

class WebhookClient:
    @staticmethod
    def generate_signature(payload: str, webhook_secret: str) -> str:
        """Generate HMAC-SHA256 signature for webhook"""
        logger.debug(f"Generating signature for payload length: {len(payload)} bytes")
        signature = hmac.new(
            webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        logger.debug(f"Signature generated successfully")
        return signature
    
    @staticmethod
    async def send_result(callback_url: str, result_dict: dict, webhook_secret: str) -> bool:
        """Send check result to callback URL"""
        try:
            # Convert to JSON
            payload = json.dumps(result_dict)
            
            # Generate signature
            signature = WebhookClient.generate_signature(payload, webhook_secret)
            
            # Send request
            headers = {
                "Content-Type": "application/json",
                "X-Signature": signature
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                result = await client.post(
                    callback_url,
                    content=payload,
                    headers=headers
                )
                
                if result.status_code == 200:
                    logger.info(f"Webhook sent successfully to {callback_url}")
                    return True
                else:
                    logger.error(f"Webhook failed: {result.status_code} - {result.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to send webhook: {str(e)}")
            return False
