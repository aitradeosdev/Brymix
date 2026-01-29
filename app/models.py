from pydantic import BaseModel, Field, validator, HttpUrl
from typing import List, Optional
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ChallengeStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"

class ViolationType(str, Enum):
    MINIMUM_TRADE_DURATION = "minimum_trade_duration"
    MAXIMUM_DRAWDOWN = "maximum_drawdown"
    PROFIT_TARGET = "profit_target"

class Rules(BaseModel):
    max_drawdown_percent: float = Field(..., gt=0, le=100)
    profit_target_percent: float = Field(..., gt=0)
    max_daily_loss_percent: Optional[float] = Field(None, gt=0, le=100)

class CheckRequest(BaseModel):
    user_id: str
    challenge_id: str
    mt5_login: str
    mt5_password: str
    mt5_server: str
    initial_balance: float = Field(..., gt=0)
    rules: Rules
    callback_url: str
    
    @validator('callback_url')
    def validate_callback_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('callback_url must be a valid HTTP/HTTPS URL')
        if len(v) > 2048:
            raise ValueError('callback_url too long (max 2048 characters)')
        return v

class Violation(BaseModel):
    rule: ViolationType
    description: str
    ticket: Optional[int] = None
    symbol: Optional[str] = None
    open_time: Optional[datetime] = None
    close_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    timestamp: Optional[datetime] = None
    equity: Optional[float] = None
    drawdown_percent: Optional[float] = None
    max_allowed_percent: Optional[float] = None
    profit_percent: Optional[float] = None
    profit_target_percent: Optional[float] = None

class Metrics(BaseModel):
    initial_balance: float
    current_balance: float
    current_equity: float
    profit_percent: float
    profit_target_percent: float
    profit_target_met: bool
    max_drawdown_percent: float
    max_drawdown_limit: float
    total_trades: int
    trades_under_4min: int

class CheckResponse(BaseModel):
    job_id: str
    user_id: str
    challenge_id: str
    status: ChallengeStatus
    metrics: Metrics
    violations: List[Violation]
    timestamp: datetime

class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str
