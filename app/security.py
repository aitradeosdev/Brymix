"""Production security middleware and utilities"""
import time
import hashlib
from collections import defaultdict, deque
from fastapi import HTTPException, Request
from cryptography.fernet import Fernet
import secrets
import base64
from threading import Lock

# Efficient rate limiting with cleanup
class RateLimiter:
    def __init__(self, cleanup_interval: int = 300):  # 5 minutes
        self._limits = defaultdict(deque)
        self._lock = Lock()
        self._last_cleanup = time.time()
        self._cleanup_interval = cleanup_interval
    
    def check_limit(self, key: str, limit: int, window: int = 60) -> bool:
        now = time.time()
        
        with self._lock:
            # Periodic cleanup
            if now - self._last_cleanup > self._cleanup_interval:
                self._cleanup_old_entries(now)
                self._last_cleanup = now
            
            # Remove expired entries for this key
            cutoff = now - window
            while self._limits[key] and self._limits[key][0] <= cutoff:
                self._limits[key].popleft()
            
            # Check limit
            if len(self._limits[key]) >= limit:
                return False
            
            # Add current request
            self._limits[key].append(now)
            return True
    
    def _cleanup_old_entries(self, now: float):
        """Remove old entries and empty keys"""
        cutoff = now - 300  # 5 minutes
        keys_to_remove = []
        
        for key, times in self._limits.items():
            while times and times[0] <= cutoff:
                times.popleft()
            if not times:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._limits[key]

rate_limiter = RateLimiter()

class SecurityManager:
    def __init__(self, encryption_key: str):
        # Ensure key is 32 bytes for Fernet
        key = hashlib.sha256(encryption_key.encode()).digest()
        self.cipher = Fernet(base64.urlsafe_b64encode(key))
    
    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        return self.cipher.decrypt(encrypted_data.encode()).decode()

def rate_limit_middleware(request: Request, limit_per_minute: int = 10):
    """Rate limiting by API key"""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        return
    
    if not rate_limiter.check_limit(api_key, limit_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

def generate_secure_key() -> str:
    """Generate cryptographically secure API key"""
    return f"brymix_{secrets.token_urlsafe(32)}"

def hash_api_key(api_key: str) -> str:
    """Hash API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()