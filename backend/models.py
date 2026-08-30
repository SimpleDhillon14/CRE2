"""
Pydantic models for the Reaction Order Prediction API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class FitRequest(BaseModel):
    time: List[float] = Field(..., description="Experimental time values")
    concentration: List[float] = Field(..., description="Experimental concentration values")
    max_order: int = Field(..., ge=0, le=10, description="Maximum reaction order to test")
    time_unit: str = Field(default="s", description="Unit of time, e.g. s, min, hr")
    concentration_unit: str = Field(default="M", description="Unit of concentration, e.g. M, mM")

    @field_validator("time", "concentration")
    @classmethod
    def not_empty(cls, v):
        if len(v) < 3:
            raise ValueError("At least 3 data points are required.")
        return v

    @model_validator(mode="after")
    def validate_data(self):
        if len(self.time) != len(self.concentration):
            raise ValueError("time and concentration arrays must have the same length.")
        if any(t < 0 for t in self.time):
            raise ValueError("Time values must be >= 0. Negative time is not physically valid.")
        if any(c < 0 for c in self.concentration):
            raise ValueError("Concentration values must be >= 0. Negative concentration is not physically valid.")
        return self


class OrderResult(BaseModel):
    order: int
    k: Optional[float] = None
    C0: Optional[float] = None
    r2: Optional[float] = None
    k_unit: Optional[str] = None
    status: str


class LinearizedPlot(BaseModel):
    x_label: str
    y_label: str
    points: List[List[float]]          # [[t, y_transformed], ...] experimental, transformed
    fit_line: List[List[float]]        # [[t0, y0], [t1, y1]] straight line from the fitted k, C0
    slope: float
    intercept: float


class SeriesXY(BaseModel):
    time: List[float]
    concentration: List[float]


class FitResponse(BaseModel):
    best_order: int
    best_k: float
    best_C0: float
    best_r2: float
    best_k_unit: str
    equation: str
    results: List[OrderResult]
    experimental: SeriesXY
    best_fit_curve: SeriesXY
    linearized: LinearizedPlot
    time_unit: str
    concentration_unit: str
