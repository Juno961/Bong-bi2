from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.api.schemas import (
    RodCalculateRequest, RodCalculateResponse,
    PlateCalculateRequest, PlateCalculateResponse,
    ScrapCalculateRequest, ScrapCalculateResponse,
    ErrorResponse
)
from core_logic.rod import (
    calculate_cross_sectional_area, calculate_bars_needed, calculate_total_weight,
    calculate_utilization_rate, calculate_total_cost, calculate_unit_cost, calculate_wastage
)
from core_logic.plate import (
    calculate_plate_weight, calculate_plate_cost, calculate_unit_cost as plate_unit_cost,
    calculate_utilization_rate as plate_utilization_rate, calculate_wastage as plate_wastage,
    calculate_scrap_savings as plate_scrap_savings
)
from core_logic.scrap import calculate_scrap_metrics

router = APIRouter()

@router.post('/calculate/rod', response_model=RodCalculateResponse)
async def calculate_rod(request: RodCalculateRequest):
    data = request.dict()
    try:
        bars_needed = calculate_bars_needed(data)
        data['barsNeeded'] = bars_needed
        total_weight = calculate_total_weight(data)
        data['totalWeight'] = total_weight
        total_cost = calculate_total_cost(data)
        data['totalCost'] = total_cost
        # Utilization then wastage
        utilization_rate = calculate_utilization_rate(data)
        data['utilizationRate'] = utilization_rate
        wastage = calculate_wastage(data)

        # Scrap metrics (optional)
        scrap = calculate_scrap_metrics(data)
        scrap_weight = scrap.get('scrapWeight')
        scrap_savings = scrap.get('scrapSavings')
        real_cost = scrap.get('realCost', total_cost)
        unit_cost = scrap.get('unitCost', calculate_unit_cost(data))
        data['scrapWeight'] = scrap_weight
        data['scrapSavings'] = scrap_savings
        data['realCost'] = real_cost
        return RodCalculateResponse(
            barsNeeded=bars_needed,
            totalWeight=total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost
        )
    except Exception as e:
        return RodCalculateResponse(error=str(e))

@router.post('/calculate/plate', response_model=PlateCalculateResponse)
async def calculate_plate(request: PlateCalculateRequest):
    data = request.dict()
    try:
        total_weight = calculate_plate_weight(data)
        data['totalWeight'] = total_weight
        total_cost = calculate_plate_cost(data)
        data['totalCost'] = total_cost
        unit_cost = plate_unit_cost(data)
        utilization_rate = plate_utilization_rate(data)
        wastage = plate_wastage(data)
        # Scrap-related fields are not calculated on plate path (None)
        scrap_savings = None
        real_cost = None
        return PlateCalculateResponse(
            totalWeight=total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapSavings=scrap_savings,
            realCost=real_cost
        )
    except Exception as e:
        return PlateCalculateResponse(error=str(e))

@router.post('/calculate/scrap', response_model=ScrapCalculateResponse)
async def calculate_scrap(request: ScrapCalculateRequest):
    data = request.dict()
    try:
        scrap = calculate_scrap_metrics(data)
        scrap_weight = scrap.get('scrapWeight') or 0.0
        scrap_savings = scrap.get('scrapSavings') or 0.0
        real_cost = scrap.get('realCost') or data.get('totalCost', 0.0)
        unit_cost = scrap.get('unitCost') or 0.0
        return ScrapCalculateResponse(
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            unitCost=unit_cost
        )
    except Exception as e:
        return ScrapCalculateResponse(error=str(e))

@router.get('/health')
async def health():
    return {"status": "ok"}

