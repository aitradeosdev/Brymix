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
        
        # Find maximum drawdown from INITIAL BALANCE (not peak)
        lowest_equity = initial_balance
        worst_drawdown = 0.0
        worst_time = None
        worst_equity = initial_balance
        
        for point in equity_curve:
            current_equity = point["equity"]
            current_time = point["time"]
            
            # Track lowest equity
            if current_equity < lowest_equity:
                lowest_equity = current_equity
            
            # Calculate drawdown from INITIAL BALANCE
            drawdown_percent = ((initial_balance - current_equity) / initial_balance) * 100
            
            # Track maximum drawdown
            if drawdown_percent > max_drawdown_reached:
                max_drawdown_reached = drawdown_percent
                worst_equity = current_equity
                worst_time = current_time
            
            # Check if breached limit
            if drawdown_percent > max_drawdown_percent:
                if drawdown_percent > worst_drawdown:
                    worst_drawdown = drawdown_percent
                    worst_time = current_time
                    worst_equity = current_equity
        
        # Create violation if breach occurred
        if worst_drawdown > max_drawdown_percent:
            violation = Violation(
                rule=ViolationType.MAXIMUM_DRAWDOWN,
                timestamp=worst_time,
                equity=worst_equity,
                drawdown_percent=round(worst_drawdown, 2),
                max_allowed_percent=max_drawdown_percent,
                description=f"Maximum Drawdown Breached: Account equity dropped to {worst_equity:,.2f} {currency} (down {worst_drawdown:.2f}% from initial balance of {initial_balance:,.2f} {currency}). Maximum allowed drawdown is {max_drawdown_percent}%. Breach occurred on {worst_time.strftime('%Y-%m-%d at %H:%M')}."
            )
            violations.append(violation)
        
        logger.info(f"Drawdown check complete: {len(violations)} violations, max DD: {max_drawdown_reached:.2f}% from initial balance")
        return violations, max_drawdown_reached
    
    def _build_equity_curve(self, initial_balance: float, deals: List[Any], positions: List[dict]) -> List[Dict]:
        """
        Build complete equity curve including floating P&L during open positions
        """
        equity_points = []
        balance_timeline = []  # Track realized balance only
        current_balance = initial_balance
        
        # Sort deals by time
        sorted_deals = sorted(deals, key=lambda d: d.time)
        
        logger.info(f"Building equity curve: {len(deals)} deals, {len(positions)} positions")
        
        # Add initial point
        start_time = datetime.fromtimestamp(sorted_deals[0].time) if sorted_deals else datetime.now()
        balance_timeline.append({"time": start_time, "balance": initial_balance})
        equity_points.append({"time": start_time, "equity": initial_balance})
        
        # Process each deal to update balance
        for deal in sorted_deals:
            deal_time = datetime.fromtimestamp(deal.time)
            
            # Update balance on exit deals (profit/loss realized)
            if deal.entry == 1:  # DEAL_ENTRY_OUT
                current_balance += deal.profit + deal.swap + deal.commission
                balance_timeline.append({"time": deal_time, "balance": current_balance})
                equity_points.append({"time": deal_time, "equity": current_balance})
                logger.debug(f"Deal exit: balance={current_balance:.2f}, profit={deal.profit:.2f}")
        
        logger.info(f"Processing {len(positions)} positions for floating P/L")
        
        # Build timeline of all ticks/bars across all positions
        # This ensures we calculate combined floating P&L when positions overlap
        all_price_points = []  # List of (time, position_id, price, position_data)
        
        for position in positions:
            if not position.get("open_time") or not position.get("close_time"):
                logger.warning(f"Position {position.get('ticket')} missing open/close time, skipping")
                continue
            
            start_time = position["open_time"]
            end_time = position["close_time"]
            
            # Get symbol info
            symbol_info = self.mt5_client.get_symbol_info(position["symbol"])
            if not symbol_info:
                logger.warning(f"No symbol info for {position['symbol']}, skipping")
                continue
            
            # Try to get TICK data first
            ticks = self.mt5_client.get_ticks(position["symbol"], start_time, end_time)
            
            if ticks is not None and len(ticks) > 0:
                logger.info(f"Position {position['ticket']}: Using {len(ticks)} ticks")
                for tick in ticks:
                    tick_time = datetime.fromtimestamp(tick['time'])
                    price = tick['bid'] if position["type"] == 0 else tick['ask']
                    all_price_points.append({
                        "time": tick_time,
                        "position": position,
                        "price": price,
                        "symbol_info": symbol_info
                    })
            else:
                # Fallback to 1-minute bars
                logger.warning(f"Position {position['ticket']}: No ticks, using 1-min bars")
                rates = self.mt5_client.get_rates(position["symbol"], mt5.TIMEFRAME_M1, start_time, end_time)
                if rates is not None and len(rates) > 0:
                    for rate in rates:
                        rate_time = datetime.fromtimestamp(rate['time'])
                        price = rate['close']
                        all_price_points.append({
                            "time": rate_time,
                            "position": position,
                            "price": price,
                            "symbol_info": symbol_info
                        })
        
        # Sort all price points by time
        all_price_points.sort(key=lambda x: x["time"])
        
        # Calculate equity at each timestamp, summing floating P&L of ALL open positions
        for point in all_price_points:
            current_time = point["time"]
            
            # Get balance at this time
            balance = self._get_balance_at_time(balance_timeline, current_time)
            
            # Find ALL positions that are open at this time
            total_floating_pnl = 0.0
            for pos in positions:
                if pos.get("open_time") and pos.get("close_time"):
                    if pos["open_time"] <= current_time <= pos["close_time"]:
                        # This position is open - calculate its floating P&L at current_time
                        pnl = self._calculate_floating_pnl_at_time(pos, current_time, all_price_points)
                        total_floating_pnl += pnl
            
            # Add equity point with combined floating P&L
            equity_points.append({
                "time": current_time,
                "equity": balance + total_floating_pnl
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
    
    def _get_balance_at_time(self, balance_timeline: List[Dict], target_time: datetime) -> float:
        """Get realized balance (without floating P&L) at specific time"""
        balance = balance_timeline[0]["balance"]
        
        for point in balance_timeline:
            if point["time"] <= target_time:
                balance = point["balance"]
            else:
                break
        
        return balance
    
    def _calculate_floating_pnl_at_time(self, position: dict, target_time: datetime, all_price_points: List[Dict]) -> float:
        """Calculate floating P&L for a position at a specific time"""
        # Find the price point closest to target_time for this position
        closest_point = None
        min_time_diff = None
        
        for point in all_price_points:
            if point["position"]["ticket"] == position["ticket"] and point["time"] <= target_time:
                time_diff = abs((target_time - point["time"]).total_seconds())
                if min_time_diff is None or time_diff < min_time_diff:
                    min_time_diff = time_diff
                    closest_point = point
        
        if not closest_point:
            return 0.0
        
        # Calculate P&L using tick value
        symbol_info = closest_point["symbol_info"]
        open_price = position["open_price"]
        current_price = closest_point["price"]
        volume = position["volume"]
        position_type = position["type"]
        tick_size = symbol_info["point"]
        
        # Calculate price difference
        if position_type == 0:  # BUY
            price_diff = current_price - open_price
        else:  # SELL
            price_diff = open_price - current_price
        
        # Get appropriate tick value
        if price_diff >= 0:
            tick_value = symbol_info.get("trade_tick_value_profit", symbol_info["trade_contract_size"])
        else:
            tick_value = symbol_info.get("trade_tick_value_loss", symbol_info["trade_contract_size"])
        
        # Calculate P&L
        ticks_moved = price_diff / tick_size
        floating_pnl = ticks_moved * tick_value * volume
        
        return floating_pnl

