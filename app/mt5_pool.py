import asyncio
import MetaTrader5 as mt5
from typing import Dict, Optional, List
from dataclasses import dataclass
from config import settings
import logging

logger = logging.getLogger(__name__)

@dataclass
class MT5Terminal:
    id: int
    path: str
    busy: bool = False
    connected: bool = False

class MT5Pool:
    def __init__(self, pool_size: int = None):
        self.pool_size = pool_size or settings.mt5_pool_size
        self.terminals: List[MT5Terminal] = []
        self.lock = asyncio.Lock()
        self._initialize_pool()
    
    def _initialize_pool(self):
        for i in range(self.pool_size):
            terminal = MT5Terminal(
                id=i,
                path=settings.mt5_path
            )
            self.terminals.append(terminal)
    
    async def get_terminal(self) -> Optional[MT5Terminal]:
        async with self.lock:
            for terminal in self.terminals:
                if not terminal.busy:
                    terminal.busy = True
                    return terminal
            return None
    
    async def release_terminal(self, terminal: MT5Terminal):
        async with self.lock:
            terminal.busy = False
            if terminal.connected:
                mt5.shutdown()
                terminal.connected = False
    
    async def connect_terminal(self, terminal: MT5Terminal, login: str, password: str, server: str) -> bool:
        try:
            # Initialize MT5 (without path since MT5 is already running)
            if not mt5.initialize():
                logger.error(f"MT5 initialize failed for terminal {terminal.id}")
                return False
            
            logger.info("MT5 initialized successfully")
            
            if not mt5.login(int(login), password, server):
                logger.error(f"MT5 login failed for terminal {terminal.id}")
                mt5.shutdown()
                return False
            
            terminal.connected = True
            return True
        except Exception as e:
            logger.error(f"Terminal {terminal.id} connection error: {e}")
            return False

# Global pool instance
mt5_pool = MT5Pool()