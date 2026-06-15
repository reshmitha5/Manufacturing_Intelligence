from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.database import create_tables
from backend.api.routes import router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Manufacturing Optimization Engine",
    description="AI-Driven Optimization for Batch Manufacturing - WEB WIZARDS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "WEB WIZARDS Manufacturing Optimizer is running!"}
