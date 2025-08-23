from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine
from routers import datasets, rules, streams, tokens, audit

# Create DB tables (simple create_all for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hackathon Backend", version="0.1.0")

# CORS for Vite dev server
origins = ["http://localhost:3000"]
app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Routers
app.include_router(datasets.router)
app.include_router(rules.router)
app.include_router(streams.router)
app.include_router(tokens.router)
app.include_router(audit.router)


@app.get("/health")
def health():
	return {"status": "ok"}