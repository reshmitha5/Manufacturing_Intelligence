from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./manufacturing.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FeedbackRecord(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String)
    action = Column(String)
    reason = Column(String)
    quality_score = Column(Float)
    yield_score = Column(Float)
    energy = Column(Float)
    carbon = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class BatchRecord(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String)
    quality_score = Column(Float)
    yield_score = Column(Float)
    energy = Column(Float)
    carbon = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
