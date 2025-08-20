from .utils import parse_float_safe


def calculate_scrap_metrics(data):
    total_weight = parse_float_safe(data.get("totalWeight"))  # kg
    total_cost = parse_float_safe(data.get("totalCost"))  # ₩
    quantity = parse_float_safe(data.get("quantity"))
    actual_product_weight_g = parse_float_safe(data.get("actualProductWeight"))  # g
    recovery_ratio = parse_float_safe(data.get("recoveryRatio"))  # %
    scrap_unit_price = parse_float_safe(data.get("scrapUnitPrice"))  # ₩/kg
    
    print(f"Scrap calculation inputs:")
    print(f"  - total_weight: {total_weight} kg")
    print(f"  - total_cost: {total_cost} ₩")
    print(f"  - quantity: {quantity}")
    print(f"  - actual_product_weight_g: {actual_product_weight_g} g")
    print(f"  - recovery_ratio: {recovery_ratio} %")
    print(f"  - scrap_unit_price: {scrap_unit_price} ₩/kg")

    # 스크랩 계산을 위한 최소 조건 확인 (None이거나 0 이하인 경우 건너뛰기)
    if recovery_ratio is None or scrap_unit_price is None or recovery_ratio <= 0 or scrap_unit_price <= 0:
        print(f"Scrap calculation skipped: recovery_ratio={recovery_ratio}, scrap_unit_price={scrap_unit_price}")
        return {
            "scrapWeight": 0.0,
            "scrapSavings": 0.0,
            "realCost": total_cost,
            "unitCost": (total_cost / quantity) if quantity > 0 else 0.0,
        }

    # actualProductWeight가 없는 경우 total_weight의 80%를 제품 중량으로 가정
    if actual_product_weight_g is None or actual_product_weight_g <= 0:
        print("Using estimated product weight (80% of total weight)")
        total_actual_product_weight_kg = total_weight * 0.8  # 80% 가정
    else:
        total_actual_product_weight_kg = (actual_product_weight_g * quantity) / 1000.0  # g -> kg

    # 스크랩 중량 = 전체 중량 - 실제 제품 중량
    scrap_weight = max(0.0, total_weight - total_actual_product_weight_kg)
    
    # 스크랩 절약 금액 = 스크랩 중량 × 스크랩 단가 × 환산비율
    scrap_savings = scrap_weight * scrap_unit_price * (recovery_ratio / 100.0)
    
    # 실제 비용 = 총 비용 - 스크랩 절약 금액
    real_cost = max(0.0, total_cost - scrap_savings)
    unit_cost = (real_cost / quantity) if quantity > 0 else 0.0
    
    print(f"Scrap calculation results:")
    print(f"  - total_actual_product_weight_kg: {total_actual_product_weight_kg} kg")
    print(f"  - scrap_weight: {scrap_weight} kg")
    print(f"  - scrap_savings: {scrap_savings} ₩")
    print(f"  - real_cost: {real_cost} ₩")
    print(f"  - unit_cost: {unit_cost} ₩")

    return {
        "scrapWeight": scrap_weight,
        "scrapSavings": scrap_savings,
        "realCost": real_cost,
        "unitCost": unit_cost,
    }


