from .utils import parse_float_safe


def calculate_scrap_metrics(data):
    total_weight = parse_float_safe(data.get("totalWeight"))  # kg
    total_cost = parse_float_safe(data.get("totalCost"))  # ₩
    quantity = parse_float_safe(data.get("quantity"))
    actual_product_weight_g = parse_float_safe(data.get("actualProductWeight"))  # g
    recovery_ratio = parse_float_safe(data.get("recoveryRatio"))  # %
    scrap_unit_price = parse_float_safe(data.get("scrapUnitPrice"))  # ₩/kg

    # Preconditions for scrap calculation
    if actual_product_weight_g <= 0 or scrap_unit_price <= 0 or recovery_ratio <= 0:
        return {
            "scrapWeight": None,
            "scrapSavings": 0.0,
            "realCost": total_cost,
            "unitCost": (total_cost / quantity) if quantity > 0 else 0.0,
        }

    total_actual_product_weight_kg = (actual_product_weight_g * quantity) / 1000.0  # g -> kg
    scrap_weight = max(0.0, total_weight - total_actual_product_weight_kg)
    scrap_savings = scrap_weight * scrap_unit_price * (recovery_ratio / 100.0)
    real_cost = max(0.0, total_cost - scrap_savings)
    unit_cost = (real_cost / quantity) if quantity > 0 else 0.0

    return {
        "scrapWeight": scrap_weight,
        "scrapSavings": scrap_savings,
        "realCost": real_cost,
        "unitCost": unit_cost,
    }


