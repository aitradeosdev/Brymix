import asyncio
import MetaTrader5 as mt5
from typing import Optional, List
from dataclasses import dataclass
from config import settings
import logging
import subprocess
import time

logger = logging.getLogger(__name__)

@dataclass
class MT5Terminal:
    id: int
    path: str
    process: Optional[subprocess.Popen] = None
    busy: bool = False
    connected: bool = False

class MT5Pool:
    """MT5 Terminal Pool supporting multiple installations.
    
    Each terminal runs as a separate process for true parallel processing.
    Requires multiple MT5 installations in different folders.
    """
    def __init__(self):
        self.terminals: List[MT5Terminal] = []
        self.lock = None  # Will be created when needed
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize pool with available MT5 paths"""
        paths = [settings.mt5_path]
        if settings.mt5_path_2:
            paths.append(settings.mt5_path_2)
        if settings.mt5_path_3:
            paths.append(settings.mt5_path_3)
        
        logger.info("="*60)
        logger.info("MT5 TERMINAL POOL INITIALIZATION")
        logger.info("="*60)
        
        for i, path in enumerate(paths):
            terminal = MT5Terminal(id=i, path=path)
            self.terminals.append(terminal)
            
            # Check if path exists
            import os
            if os.path.exists(path):
                logger.info(f"✅ Terminal {i}: {path}")
            else:
                logger.warning(f"⚠️  Terminal {i}: {path} (NOT FOUND)")
        
        logger.info("="*60)
        logger.info(f"Pool Size: {len(self.terminals)} terminal(s) configured")
        logger.info("="*60)
        logger.info("")
        logger.info("IMPORTANT: Each terminal must be:")
        logger.info("  1. Installed at the path above")
        logger.info("  2. Running (opened)")
        logger.info("  3. Logged into ANY account")
        logger.info("")
        logger.info("Terminals will be tested when first job arrives.")
        logger.info("="*60)
    
    async def get_terminal(self) -> Optional[MT5Terminal]:
        """Get an available terminal from the pool"""
        if self.lock is None:
            self.lock = asyncio.Lock()
        
        async with self.lock:
            for terminal in self.terminals:
                if not terminal.busy:
                    terminal.busy = True
                    logger.info(f"Terminal {terminal.id} acquired")
                    return terminal
            logger.warning("No available terminals in pool")
            return None
    
    async def release_terminal(self, terminal: MT5Terminal):
        """Release terminal back to pool"""
        if self.lock is None:
            self.lock = asyncio.Lock()
        
        async with self.lock:
            terminal.busy = False
            if terminal.connected:
                try:
                    mt5.shutdown()
                    terminal.connected = False
                    logger.info(f"Terminal {terminal.id} disconnected")
                except Exception as e:
                    logger.error(f"Error shutting down terminal {terminal.id}: {e}")
            logger.info(f"Terminal {terminal.id} released")
    
    async def connect_terminal(self, terminal: MT5Terminal, login: str, password: str, server: str) -> bool:
        """Connect terminal to MT5 account"""
        try:
            logger.info(f"Connecting terminal {terminal.id} to {login}@{server}")
            
            # Initialize MT5 with specific path
            if not mt5.initialize(terminal.path, timeout=settings.mt5_timeout):
                error = mt5.last_error()
                logger.error(f"Terminal {terminal.id} initialize failed: {error}")
                logger.error(f"Path: {terminal.path}")
                logger.error("Make sure MT5 is installed and logged into any account")
                return False
            
            logger.info(f"Terminal {terminal.id} initialized")
            
            # Login to specific account
            if not mt5.login(int(login), password, server):
                error = mt5.last_error()
                logger.error(f"Terminal {terminal.id} login failed: {error}")
                logger.error(f"Credentials: {login}@{server}")
                mt5.shutdown()
                return False
            
            logger.info(f"Terminal {terminal.id} logged in: {login}@{server}")
            terminal.connected = True
            return True
            
        except Exception as e:
            logger.error(f"Terminal {terminal.id} connection error: {e}")
            return False

# Global pool instance
mt5_pool = MT5Pool()