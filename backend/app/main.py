from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.db import Base, engine
from .routers import datasets, streams, tokens, receipts
from .core.config import ensure_data_dir
from .models import models as _models  # ensure models are imported

app = FastAPI(title="Synthetic Streams Backend")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
app.include_router(streams.router, prefix="/streams", tags=["streams"])
app.include_router(tokens.router, prefix="/tokens", tags=["tokens"])
app.include_router(receipts.router, prefix="", tags=["receipts"])  # /audit/{id}/receipt

@app.on_event("startup")
async def on_startup():
    ensure_data_dir()
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"status": "ok"}