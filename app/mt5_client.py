import MetaTrader5 as mt5
from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class MT5Client:
    def __init__(self, mt5_path: str, timeout: int = 30):
        self.mt5_path = mt5_path
        self.timeout = timeout
        self.connected = False
        
    def initialize(self) -> bool:
        """Initialize MT5 terminal"""
        if not mt5.initialize(self.mt5_path, timeout=self.timeout):
            logger.error(f"MT5 initialize failed: {mt5.last_error()}")
            return False
        self.connected = True
        logger.info("MT5 initialized successfully")
        return True
    
    def login(self, login: str, password: str, server: str) -> bool:
        """Login to MT5 account"""
        if not self.connected:
            if not self.initialize():
                return False
        
        login_int = int(login)
        if not mt5.login(login_int, password=password, server=server):
            logger.error(f"MT5 login failed for {login}: {mt5.last_error()}")
            return False
        
        logger.info(f"MT5 logged in successfully: {login}")
        return True
    
    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Get account information"""
        account_info = mt5.account_info()
        if account_info is None:
            logger.error(f"Failed to get account info: {mt5.last_error()}")
            return None
        
        return {
            "balance": account_info.balance,
            "equity": account_info.equity,
            "profit": account_info.profit,
            "margin": account_info.margin,
            "margin_free": account_info.margin_free,
            "currency": account_info.currency,
        }
    
    def get_deals_history(self, from_date: Optional[datetime] = None) -> List[Any]:
        """Get all deals from history"""
        if from_date is None:
            from_date = datetime(2000, 1, 1)
        
        to_date = datetime.now()
        deals = mt5.history_deals_get(from_date, to_date)
        
        if deals is None:
            logger.error(f"Failed to get deals: {mt5.last_error()}")
            return []
        
        logger.info(f"Retrieved {len(deals)} deals")
        return list(deals)
    
    def get_positions_history(self, from_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Get all closed positions from history using deals reconstruction"""
        if from_date is None:
            from_date = datetime(2000, 1, 1)
        
        to_date = datetime.now()
        
        # Get deals and reconstruct positions properly
        deals = self.get_deals_history(from_date)
        positions = {}
        
        for deal in deals:
            if deal.position_id == 0:
                continue
            
            pos_id = deal.position_id
            if pos_id not in positions:
                positions[pos_id] = {
                    "ticket": pos_id,
                    "symbol": deal.symbol,
                    "type": deal.type,
                    "volume": 0,
                    "open_time": None,
                    "close_time": None,
                    "open_price": None,
                    "close_price": None,
                    "profit": 0,
                    "swap": 0,
                    "commission": 0,
                    "deals": []
                }
            
            positions[pos_id]["deals"].append(deal)
            
            # Entry deal (opening position)
            if deal.entry == 0:  # DEAL_ENTRY_IN
                positions[pos_id]["open_time"] = datetime.fromtimestamp(deal.time)
                positions[pos_id]["open_price"] = deal.price
                positions[pos_id]["volume"] = deal.volume
            # Exit deal (closing position)  
            elif deal.entry == 1:  # DEAL_ENTRY_OUT
                positions[pos_id]["close_time"] = datetime.fromtimestamp(deal.time)
                positions[pos_id]["close_price"] = deal.price
            
            # Accumulate profit, swap, commission
            positions[pos_id]["profit"] += deal.profit
            positions[pos_id]["swap"] += deal.swap
            positions[pos_id]["commission"] += deal.commission
        
        # Filter only closed positions (have both open and close times)
        closed_positions = [p for p in positions.values() if p["open_time"] and p["close_time"]]
        logger.info(f"Retrieved {len(closed_positions)} closed positions from {len(deals)} deals")
        return closed_positions
    
    def get_rates(self, symbol: str, timeframe: int, from_date: datetime, to_date: datetime) -> Optional[Any]:
        """Get historical rates (bars) for a symbol"""
        rates = mt5.copy_rates_range(symbol, timeframe, from_date, to_date)
        
        if rates is None or len(rates) == 0:
            logger.warning(f"No rates found for {symbol} from {from_date} to {to_date}")
            return None
        
        return rates
    
    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get symbol information"""
        symbol_info = mt5.symbol_info(symbol)
        
        if symbol_info is None:
            logger.error(f"Failed to get symbol info for {symbol}: {mt5.last_error()}")
            return None
        
        return {
            "point": symbol_info.point,
            "trade_contract_size": symbol_info.trade_contract_size,
            "digits": symbol_info.digits,
            "currency_base": symbol_info.currency_base,
            "currency_profit": symbol_info.currency_profit,
        }
    
    def shutdown(self):
        """Shutdown MT5 connection"""
        if self.connected:
            mt5.shutdown()
            self.connected = False
            logger.info("MT5 shutdown")
