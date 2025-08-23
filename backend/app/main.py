from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.db import Base, engine
from .routers import datasets, streams
from .core.config import ensure_data_dir
from .routers import tokens as tokens_router
from .routers import audit as audit_router
from .routers import rules as rules_router

app = FastAPI(title="Synthetic Streams Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
app.include_router(rules_router.router, prefix="/rules", tags=["rules"])
app.include_router(streams.router, prefix="/streams", tags=["streams"])
app.include_router(tokens_router.router, prefix="/tokens", tags=["tokens"])
app.include_router(audit_router.router, prefix="/audit", tags=["audit"])

@app.on_event("startup")
async def on_startup():
    ensure_data_dir()
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"status": "ok"}