from typing import List
from datetime import datetime
from app.models import Violation, ViolationType
import logging

logger = logging.getLogger(__name__)

MINIMUM_TRADE_DURATION_SECONDS = 240  # 4 minutes

class DurationChecker:
    @staticmethod
    def check_positions(positions: List[dict]) -> List[Violation]:
        """Check all positions for minimum 4-minute duration rule"""
        violations = []
        violating_trades = []
        
        logger.info(f"Checking {len(positions)} positions for 4-minute rule")
        
        for position in positions:
            open_time = position.get("open_time")
            close_time = position.get("close_time")
            ticket = position.get("ticket")
            symbol = position.get("symbol")
            
            if not open_time or not close_time:
                logger.warning(f"Position {ticket} missing open/close time: open={open_time}, close={close_time}")
                continue
            
            # Ensure we have datetime objects
            if not isinstance(open_time, datetime):
                logger.error(f"Position {ticket} open_time is not datetime: {type(open_time)}")
                continue
            if not isinstance(close_time, datetime):
                logger.error(f"Position {ticket} close_time is not datetime: {type(close_time)}")
                continue
            
            duration = (close_time - open_time).total_seconds()
            
            logger.debug(f"Position {ticket} ({symbol}): {duration}s duration")
            
            if duration < MINIMUM_TRADE_DURATION_SECONDS:
                violating_trades.append({
                    "ticket": ticket,
                    "symbol": symbol,
                    "duration": int(duration),
                    "open_time": open_time,
                    "close_time": close_time
                })
                logger.warning(f"VIOLATION: Ticket {ticket} ({symbol}) held for only {duration}s < {MINIMUM_TRADE_DURATION_SECONDS}s")
        
        # Create single violation if any trades violated the rule
        if violating_trades:
            trade_details = ", ".join([
                f"#{trade['ticket']} ({trade['symbol']}: {trade['duration']//60}m {trade['duration']%60}s)"
                for trade in violating_trades
            ])
            
            violation = Violation(
                rule=ViolationType.MINIMUM_TRADE_DURATION,
                description=f"4-minute rule violated: {len(violating_trades)} trades held < 4 minutes. Trades: {trade_details}",
                # Include first violating trade details for reference
                ticket=violating_trades[0]["ticket"],
                symbol=violating_trades[0]["symbol"],
                open_time=violating_trades[0]["open_time"],
                close_time=violating_trades[0]["close_time"],
                duration_seconds=violating_trades[0]["duration"]
            )
            violations.append(violation)
        
        logger.info(f"Duration check complete: {len(violations)} rule violations found ({len(violating_trades)} violating trades)")
        return violations
