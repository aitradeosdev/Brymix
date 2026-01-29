from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import MetaTrader5 as mt5
from app.models import Violation, ViolationType
from app.mt5_client import MT5Client
import logging

logger = logging.getLogger(__name__)

class DrawdownChecker:
    def __init__(self, mt5_client: MT5Client):
        self.mt5_client = mt5_client
    
    def check_drawdown(
        self, 
        initial_balance: float, 
        max_drawdown_percent: float,
        positions: List[dict],
        deals: List[Any]
    ) -> tuple[List[Violation], float]:
        """
        Check if account breached maximum drawdown at any point
        Returns: (violations, max_drawdown_reached)
        """
        violations = []
        max_drawdown_reached = 0.0
        
        if not deals:
            return violations, max_drawdown_reached
        
        # Get account currency
        account_info = self.mt5_client.get_account_info()
        currency = account_info.get('currency', 'USD') if account_info else 'USD'
        
        # Build complete equity curve from deals
        equity_curve = self._build_equity_curve(initial_balance, deals, positions)
        
        if not equity_curve:
            return violations, max_drawdown_reached
        
        # Find maximum drawdown from peak equity
        peak_equity = initial_balance
        worst_drawdown = 0.0
        worst_time = None
        worst_equity = initial_balance
        
        for point in equity_curve:
            current_equity = point["equity"]
            current_time = point["time"]
            
            # Update peak equity
            if current_equity > peak_equity:
                peak_equity = current_equity
            
            # Calculate drawdown from peak
            drawdown_percent = ((peak_equity - current_equity) / peak_equity) * 100
            
            # Track maximum drawdown
            if drawdown_percent > max_drawdown_reached:
                max_drawdown_reached = drawdown_percent
            
            # Check if breached limit
            if drawdown_percent > max_drawdown_percent:
                if drawdown_percent > worst_drawdown:
                    worst_drawdown = drawdown_percent
                    worst_time = current_time
                    worst_equity = current_equity
        
        # Create violation if breach occurred
        if worst_drawdown > max_drawdown_percent:
            # Calculate drawdown from initial balance for user clarity
            initial_drawdown = ((initial_balance - worst_equity) / initial_balance) * 100
            
            violation = Violation(
                rule=ViolationType.MAXIMUM_DRAWDOWN,
                timestamp=worst_time,
                equity=worst_equity,
                drawdown_percent=round(worst_drawdown, 2),
                max_allowed_percent=max_drawdown_percent,
                description=f"Drawdown Rule Violation: Your account dropped {abs(initial_drawdown):.1f}% from your starting balance of {initial_balance:,.2f} {currency} to {worst_equity:,.2f} {currency} on {worst_time.strftime('%Y-%m-%d at %H:%M')}. Maximum allowed drawdown is {max_drawdown_percent}%. This breach occurred during live trading and cannot be reversed by subsequent profits."
            )
            violations.append(violation)
        
        logger.info(f"Drawdown check complete: {len(violations)} violations, max DD: {max_drawdown_reached:.2f}% from peak")
        return violations, max_drawdown_reached
    
    def _build_equity_curve(self, initial_balance: float, deals: List[Any], positions: List[dict]) -> List[Dict]:
        """
        Build complete equity curve including floating P&L during open positions
        """
        equity_points = []
        current_balance = initial_balance
        
        # Sort deals by time
        sorted_deals = sorted(deals, key=lambda d: d.time)
        
        # Add initial point
        start_time = datetime.fromtimestamp(sorted_deals[0].time) if sorted_deals else datetime.now()
        equity_points.append({"time": start_time, "equity": initial_balance})
        
        # Process each deal to update balance
        for deal in sorted_deals:
            deal_time = datetime.fromtimestamp(deal.time)
            
            # Update balance on exit deals (profit/loss realized)
            if deal.entry == 1:  # DEAL_ENTRY_OUT
                current_balance += deal.profit + deal.swap + deal.commission
                equity_points.append({"time": deal_time, "equity": current_balance})
        
        # Add floating P&L for open positions
        open_positions = [p for p in positions if p.get("open_time") and p.get("close_time")]
        
        for position in open_positions:
            start_time = position["open_time"]
            end_time = position["close_time"]
            
            # Get 1-minute bars for this position
            rates = self.mt5_client.get_rates(position["symbol"], mt5.TIMEFRAME_M1, start_time, end_time)
            if rates is None or len(rates) == 0:
                continue
            
            # Calculate floating equity for each minute
            for rate in rates:
                rate_time = datetime.fromtimestamp(rate['time'])
                
                # Get balance at this time
                balance_at_time = self._get_balance_at_time(equity_points, rate_time)
                
                # Calculate floating P&L
                floating_pnl = self._calculate_floating_pnl_at_rate(position, rate)
                
                # Add equity point with floating P&L
                equity_points.append({
                    "time": rate_time,
                    "equity": balance_at_time + floating_pnl
                })
        
        # Sort by time and remove duplicates
        equity_points.sort(key=lambda x: x["time"])
        
        # Remove duplicate timestamps, keep last equity value
        unique_points = []
        last_time = None
        
        for point in equity_points:
            if point["time"] != last_time:
                unique_points.append(point)
                last_time = point["time"]
            else:
                # Update equity for same timestamp
                unique_points[-1]["equity"] = point["equity"]
        
        return unique_points
    
    def _get_balance_at_time(self, equity_points: List[Dict], target_time: datetime) -> float:
        """Get balance (without floating P&L) at specific time"""
        balance = equity_points[0]["equity"]
        
        for point in equity_points:
            if point["time"] <= target_time:
                balance = point["equity"]
            else:
                break
        
        return balance
    
    def _calculate_floating_pnl_at_rate(self, position: dict, rate: Any) -> float:
        """Calculate floating P&L for position at specific rate"""
        # Get symbol info
        symbol_info = self.mt5_client.get_symbol_info(position["symbol"])
        if not symbol_info:
            return 0.0
        
        contract_size = symbol_info["trade_contract_size"]
        open_price = position["open_price"]
        volume = position["volume"]
        
        # Calculate P&L based on position type
        if position["type"] == 0:  # BUY
            price_diff = rate['close'] - open_price
        else:  # SELL
            price_diff = open_price - rate['close']
        
        return volume * contract_size * price_diff
