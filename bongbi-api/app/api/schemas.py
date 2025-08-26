from typing import Optional
from pydantic import BaseModel, Field, conint, confloat, model_validator


class ErrorResponse(BaseModel):
    status_code: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Error message")


class RodCalculateRequest(BaseModel):
    materialType: Optional[str] = Field(None, description="Material type identifier")
    shape: str = Field(..., description="Rod shape identifier")
    diameter: Optional[confloat(ge=0)] = Field(None, description="Diameter in mm for circular/square/hexagon")
    width: Optional[confloat(ge=0)] = Field(None, description="Width in mm for rectangular rods")
    height: Optional[confloat(ge=0)] = Field(None, description="Height in mm for rectangular rods")
    productLength: confloat(gt=0) = Field(..., description="Product length in mm")
    quantity: conint(ge=1) = Field(..., description="Quantity of products")
    cuttingLoss: confloat(ge=0) = Field(0, description="Cutting loss in mm")
    headCut: confloat(ge=0) = Field(0, description="Head loss in mm")
    tailCut: confloat(ge=0) = Field(0, description="Tail loss in mm")
    standardBarLength: confloat(gt=0) = Field(..., description="Standard bar length in mm")
    materialDensity: confloat(gt=0) = Field(..., description="Material density (kg/m³ from master; will be normalized)")
    materialPrice: confloat(ge=0) = Field(..., description="Material unit price (₩/kg)")
    actualProductWeight: Optional[confloat(ge=0)] = Field(None, description="Actual product weight in grams")
    recoveryRatio: Optional[confloat(ge=0)] = Field(None, description="Scrap recovery ratio (%)")
    scrapUnitPrice: Optional[confloat(ge=0)] = Field(None, description="Scrap unit price (₩/kg)")

    @model_validator(mode="after")
    def validate_shape_dimensions(self) -> "RodCalculateRequest":
        shape_lower = (self.shape or "").lower()
        if shape_lower == "rectangle":
            if self.width is None or self.height is None:
                raise ValueError("width and height are required for rectangle shape")
        else:
            if self.diameter is None:
                raise ValueError("diameter is required for non-rectangle shapes")
        return self


class PlateCalculateRequest(BaseModel):
    materialType: Optional[str] = Field(None, description="Material type identifier")
    plateThickness: confloat(gt=0) = Field(..., description="Plate thickness in mm")
    plateWidth: confloat(gt=0) = Field(..., description="Plate width in mm")
    plateLength: confloat(gt=0) = Field(..., description="Plate length in mm")
    quantity: conint(ge=1) = Field(..., description="Quantity of plates")
    materialDensity: confloat(gt=0) = Field(..., description="Material density (kg/m³ from master; will be normalized)")
    plateUnitPrice: confloat(ge=0) = Field(..., description="Plate unit price (₩/kg)")


class ScrapCalculateRequest(BaseModel):
    totalWeight: confloat(ge=0) = Field(..., description="Total weight in kg")
    totalCost: confloat(ge=0) = Field(..., description="Total material cost in ₩ before scrap savings")
    quantity: conint(ge=1) = Field(..., description="Quantity of products")
    actualProductWeight: confloat(ge=0) = Field(..., description="Actual product weight per unit in grams")
    recoveryRatio: confloat(gt=0) = Field(..., description="Scrap recovery ratio (%)")
    scrapUnitPrice: confloat(gt=0) = Field(..., description="Scrap unit price (₩/kg)")


class RodCalculateResponse(BaseModel):
    barsNeeded: int
    totalWeight: float
    totalCost: float
    unitCost: float
    utilizationRate: float
    wastage: float
    scrapWeight: Optional[float] = None
    scrapSavings: Optional[float] = None
    realCost: Optional[float] = None
    error: Optional[str] = None


class PlateCalculateResponse(BaseModel):
    totalWeight: float
    totalCost: float
    unitCost: float
    utilizationRate: float
    wastage: float
    scrapSavings: Optional[float] = None
    realCost: Optional[float] = None
    error: Optional[str] = None


class ScrapCalculateResponse(BaseModel):
    scrapWeight: float
    scrapSavings: float
    realCost: float
    unitCost: float
    error: Optional[str] = None


