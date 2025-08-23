from fastapi import FastAPI
from .core.db import Base, engine
from .routers import datasets, streams
from .core.config import ensure_data_dir

app = FastAPI(title="Synthetic Streams Backend")

app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
app.include_router(streams.router, prefix="/streams", tags=["streams"])

@app.on_event("startup")
async def on_startup():
    ensure_data_dir()
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"status": "ok"}