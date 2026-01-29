from typing import List
from datetime import datetime
from app.models import CheckRequest, CheckResponse, Metrics, Violation, ChallengeStatus
from app.mt5_client import MT5Client
from app.duration_checker import DurationChecker
from app.drawdown_checker import DrawdownChecker
import logging

logger = logging.getLogger(__name__)

class RuleChecker:
    def __init__(self, mt5_client: MT5Client):
        self.mt5_client = mt5_client
        self.duration_checker = DurationChecker()
        self.drawdown_checker = DrawdownChecker(mt5_client)
    
    def check_challenge(self, request: CheckRequest, job_id: str) -> CheckResponse:
        """
        Main orchestrator - runs all checks and compiles results
        """
        logger.info(f"Starting challenge check for job {job_id}")
        
        # Login to MT5
        if not self.mt5_client.login(request.mt5_login, request.mt5_password, request.mt5_server):
            raise Exception("Failed to login to MT5")
        
        try:
            # Get account data
            account_info = self.mt5_client.get_account_info()
            if not account_info:
                raise Exception("Failed to get account info")
            
            # Get all historical data
            deals = self.mt5_client.get_deals_history()
            positions = self.mt5_client.get_positions_history()
            
            logger.info(f"Retrieved {len(positions)} positions and {len(deals)} deals")
            
            # Run all checks
            all_violations = []
            
            # 1. Check 4-minute rule
            duration_violations = self.duration_checker.check_positions(positions)
            all_violations.extend(duration_violations)
            
            # Count individual violating trades for metrics
            trades_under_4min = 0
            if duration_violations:
                # Extract count from description or count manually
                for pos in positions:
                    if pos.get("open_time") and pos.get("close_time"):
                        duration = (pos["close_time"] - pos["open_time"]).total_seconds()
                        if duration < 240:  # 4 minutes
                            trades_under_4min += 1
            
            # 2. Check drawdown
            drawdown_violations, max_drawdown = self.drawdown_checker.check_drawdown(
                request.initial_balance,
                request.rules.max_drawdown_percent,
                positions,
                deals
            )
            all_violations.extend(drawdown_violations)
            
            # Calculate metrics
            current_balance = account_info["balance"]
            current_equity = account_info["equity"]
            profit_percent = ((current_balance - request.initial_balance) / request.initial_balance) * 100
            profit_target_met = profit_percent >= request.rules.profit_target_percent
            
            # 3. Check profit target (only if no other violations - this is usually checked at challenge end)
            if not profit_target_met:
                from app.models import ViolationType
                profit_violation = Violation(
                    rule=ViolationType.PROFIT_TARGET,
                    description=f"Profit target not met: {profit_percent:.2f}% (required: {request.rules.profit_target_percent}%)",
                    profit_percent=round(profit_percent, 2),
                    profit_target_percent=request.rules.profit_target_percent
                )
                all_violations.append(profit_violation)
            
            metrics = Metrics(
                initial_balance=request.initial_balance,
                current_balance=current_balance,
                current_equity=current_equity,
                profit_percent=round(profit_percent, 2),
                profit_target_percent=request.rules.profit_target_percent,
                profit_target_met=profit_target_met,
                max_drawdown_percent=round(max_drawdown, 2),
                max_drawdown_limit=request.rules.max_drawdown_percent,
                total_trades=len(positions),
                trades_under_4min=trades_under_4min
            )
            
            # Determine status
            status = ChallengeStatus.PASSED if len(all_violations) == 0 else ChallengeStatus.FAILED
            
            response = CheckResponse(
                job_id=job_id,
                user_id=request.user_id,
                challenge_id=request.challenge_id,
                status=status,
                metrics=metrics,
                violations=all_violations,
                timestamp=datetime.now()
            )
            
            logger.info(f"Challenge check complete: {status}, {len(all_violations)} violations")
            return response
            
        finally:
            # Don't shutdown - keep connection alive
            pass
