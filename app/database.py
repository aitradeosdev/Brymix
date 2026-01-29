from sqlalchemy import create_engine, Column, String, DateTime, Float, Integer, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    challenge_id = Column(String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    result = Column(Text)
    error_message = Column(Text)
    api_key_owner = Column(String, nullable=True)  # Track which API key created this job

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_email = Column(String, nullable=True)  # Track owner for multi-tenancy
    company = Column(String, nullable=True)  # Company name
    webhook_secret = Column(String, nullable=True)  # Per-API-key webhook secret

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database initialization error: {e}")
    raise