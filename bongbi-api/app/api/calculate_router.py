from fastapi import APIRouter, Request, HTTPException
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

@router.post('/calculate/rod', response_model=RodCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
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
        scrap_weight = scrap.get('scrapWeight', 0.0) or 0.0
        scrap_savings = scrap.get('scrapSavings', 0.0) or 0.0
        real_cost = scrap.get('realCost', total_cost)
        # 개당 단가는 항상 원재료 기준(스크랩 미반영)
        unit_cost = calculate_unit_cost(data)

        # 새로운 필드 계산
        is_plate = False
        total_actual_product_weight = None
        try:
            actual_weight_g = data.get('actualProductWeight')
            quantity = data.get('quantity')
            if actual_weight_g is not None and quantity is not None:
                total_actual_product_weight = (float(actual_weight_g) / 1000.0) * float(quantity)
        except Exception:
            total_actual_product_weight = None

        return RodCalculateResponse(
            barsNeeded=bars_needed,
            totalWeight=total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            isPlate=is_plate,
            totalActualProductWeight=total_actual_product_weight,
        )
    except Exception as e:
        return JSONResponse(status_code=400, content=ErrorResponse(status_code=400, message=str(e)).model_dump())

@router.post('/calculate/plate', response_model=PlateCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
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
        # 판재는 스크랩 관련 값을 계산하지 않음 → 기본값
        scrap_savings = 0.0
        real_cost = total_cost

        # 새로운 필드 계산
        is_plate = True
        total_actual_product_weight = None

        return PlateCalculateResponse(
            totalWeight=total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            isPlate=is_plate,
            totalActualProductWeight=total_actual_product_weight,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/calculate/scrap', response_model=ScrapCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
async def calculate_scrap(request: ScrapCalculateRequest):
    data = request.dict()
    try:
        scrap = calculate_scrap_metrics(data)
        scrap_weight = scrap.get('scrapWeight') or 0.0
        scrap_savings = scrap.get('scrapSavings') or 0.0
        real_cost = scrap.get('realCost') if scrap.get('realCost') is not None else data.get('totalCost', 0.0)
        unit_cost = scrap.get('unitCost') or 0.0
        return ScrapCalculateResponse(
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            unitCost=unit_cost
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/health')
async def health():
    return {"status": "ok"}

