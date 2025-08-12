from typing import Optional
from pydantic import BaseModel, Field, conint, confloat, model_validator


class RodCalculateRequest(BaseModel):
    materialType: Optional[str] = Field(None, description="재질 유형 (rod 또는 sheet)")
    shape: str = Field(..., description="봉재 형상 종류 (circle, hexagon, square, rectangle 등)")
    diameter: Optional[confloat(ge=0)] = Field(None, description="원형/육각형/정사각형의 직경")
    width: Optional[confloat(ge=0)] = Field(None, description="직사각형(봉재) 가로")
    height: Optional[confloat(ge=0)] = Field(None, description="직사각형(봉재) 세로")
    productLength: confloat(gt=0) = Field(..., description="봉재 가공 시 제품 길이")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량")
    cuttingLoss: confloat(ge=0) = Field(0, description="절단 시 손실되는 길이")
    headCut: confloat(ge=0) = Field(0, description="봉재 선단 가공 손실")
    tailCut: confloat(ge=0) = Field(0, description="봉재 후단 가공 손실")
    standardBarLength: confloat(gt=0) = Field(..., description="표준 봉재 길이")
    materialDensity: confloat(gt=0) = Field(..., description="재질의 밀도")
    materialPrice: confloat(ge=0) = Field(..., description="봉재의 kg당 단가")
    actualProductWeight: Optional[confloat(ge=0)] = Field(None, description="사용자가 입력하는 제품 1개 실제 중량 (g)")
    recoveryRatio: Optional[confloat(ge=0)] = Field(None, description="스크랩 환산율 (%)")
    scrapUnitPrice: Optional[confloat(ge=0)] = Field(None, description="스크랩 회수 단가")

    @model_validator(mode="after")
    def validate_shape_dimensions(self) -> "RodCalculateRequest":
        shape_lower = (self.shape or "").lower()
        if shape_lower == "rectangle":
            if self.width is None or self.height is None:
                raise ValueError("직사각형의 경우 가로와 세로가 필요합니다")
        else:
            if self.diameter is None:
                raise ValueError("직사각형이 아닌 형상의 경우 직경이 필요합니다")
        return self


class PlateCalculateRequest(BaseModel):
    materialType: Optional[str] = Field(None, description="재질 유형 (rod 또는 sheet)")
    plateThickness: confloat(gt=0) = Field(..., description="판재의 두께")
    plateWidth: confloat(gt=0) = Field(..., description="판재의 폭")
    plateLength: confloat(gt=0) = Field(..., description="판재의 길이")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량")
    materialDensity: confloat(gt=0) = Field(..., description="재질의 밀도")
    plateUnitPrice: confloat(ge=0) = Field(..., description="판재의 kg당 단가")


class ScrapCalculateRequest(BaseModel):
    totalWeight: confloat(ge=0) = Field(..., description="전체 제품의 총 중량")
    totalCost: confloat(ge=0) = Field(..., description="전체 생산에 필요한 재료비")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량")
    actualProductWeight: confloat(ge=0) = Field(..., description="사용자가 입력하는 제품 1개 실제 중량 (g)")
    recoveryRatio: confloat(gt=0) = Field(..., description="스크랩 환산율 (%)")
    scrapUnitPrice: confloat(gt=0) = Field(..., description="스크랩 회수 단가")


# 응답 모델 - error 필드 제거, 새 필드 추가
class RodCalculateResponse(BaseModel):
    barsNeeded: int = Field(..., description="필요한 봉재 수량")
    totalWeight: float = Field(..., description="전체 제품의 총 중량")
    totalCost: float = Field(..., description="전체 생산에 필요한 재료비")
    unitCost: float = Field(..., description="제품 1개당 재료 단가")
    utilizationRate: float = Field(..., description="자재 사용 효율")
    wastage: float = Field(..., description="자재 사용 손실률")
    scrapWeight: float = Field(0.0, description="제품 생산 후 남은 재활용 가능한 자투리 자재량")
    scrapSavings: float = Field(0.0, description="스크랩 회수로 절약된 금액")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비")
    isPlate: bool = Field(False, description="판재 여부(true/false)")
    totalActualProductWeight: Optional[float] = Field(None, description="실제 제품 1개 중량 × 수량의 합 (kg)")


class PlateCalculateResponse(BaseModel):
    totalWeight: float = Field(..., description="전체 제품의 총 중량")
    totalCost: float = Field(..., description="전체 생산에 필요한 재료비")
    unitCost: float = Field(..., description="제품 1개당 재료 단가")
    utilizationRate: float = Field(..., description="자재 사용 효율")
    wastage: float = Field(..., description="자재 사용 손실률")
    scrapSavings: float = Field(0.0, description="스크랩 회수로 절약된 금액")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비")
    isPlate: bool = Field(True, description="판재 여부(true/false)")
    totalActualProductWeight: Optional[float] = Field(None, description="실제 제품 1개 중량 × 수량의 합 (kg)")


class ScrapCalculateResponse(BaseModel):
    scrapWeight: float = Field(..., description="제품 생산 후 남은 재활용 가능한 자투리 자재량")
    scrapSavings: float = Field(..., description="스크랩 회수로 절약된 금액")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비")
    unitCost: float = Field(..., description="제품 1개당 재료 단가")


# 오류 응답은 별도 처리
class ErrorResponse(BaseModel):
    status_code: int = Field(..., description="HTTP 상태 코드")
    message: str = Field(..., description="오류 메시지")
    detail: Optional[str] = Field(None, description="상세 오류 내용")
