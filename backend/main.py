"""
FastAPI backend for the Reaction Order Prediction GUI.

Run locally:
    uvicorn main:app --reload

Endpoints:
    GET  /api/health
    POST /api/fit
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from models import FitRequest, FitResponse
import kinetics

app = FastAPI(
    title="Reaction Order Prediction API",
    description="Nonlinear curve fitting of concentration-time data to determine reaction order.",
    version="1.0.0",
)

# Allow the frontend (any origin) to call this API. Restrict allow_origins
# to your deployed frontend URL once you know it, for tighter security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/fit", response_model=FitResponse)
def fit_reaction_order(payload: FitRequest):
    try:
        response = kinetics.build_response(
            payload.time,
            payload.concentration,
            payload.max_order,
            payload.time_unit,
            payload.concentration_unit,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
