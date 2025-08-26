from .utils import parse_float_safe, kg_per_m3_to_g_per_cm3
import math

# 1. 단면적 계산
# related_columns: shape, diameter, width, height
def calculate_cross_sectional_area(data):
    shape = data.get('shape', '').lower()
    diameter = parse_float_safe(data.get('diameter'))
    width = parse_float_safe(data.get('width'))
    height = parse_float_safe(data.get('height'))
    if shape == 'circle':
        return math.pi * (diameter / 2) ** 2
    elif shape == 'square':
        return diameter ** 2
    elif shape == 'rectangle':
        return width * height
    elif shape == 'hexagon':
        return (3 * math.sqrt(3) / 8) * diameter ** 2
    else:
        return 0.0

# 2. 봉재 필요 개수 계산
# related_columns: productLength, cuttingLoss, standardBarLength, headCut, tailCut, quantity
def calculate_bars_needed(data):
    product_length = parse_float_safe(data.get('productLength'))
    cutting_loss = parse_float_safe(data.get('cuttingLoss'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    head_cut = parse_float_safe(data.get('headCut'))
    tail_cut = parse_float_safe(data.get('tailCut'))
    quantity = parse_float_safe(data.get('quantity'))
    unit_length = product_length + cutting_loss
    usable_length = standard_bar_length - head_cut - tail_cut
    if unit_length <= 0 or usable_length <= 0:
        return 0
    pieces_per_bar = math.floor(usable_length / unit_length) if unit_length > 0 else 0
    if pieces_per_bar <= 0:
        return 0
    bars_needed = math.ceil(quantity / pieces_per_bar) if pieces_per_bar > 0 else 0
    return int(bars_needed)

# 3. 총 중량 계산
# related_columns: shape, diameter, width, height, barsNeeded, standardBarLength, materialDensity
def calculate_total_weight(data):
    area = calculate_cross_sectional_area(data)
    bars_needed = parse_float_safe(data.get('barsNeeded'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    material_density_kg_per_m3 = parse_float_safe(data.get('materialDensity'))
    # Normalize density to g/cm³ for volume in cm³
    material_density = kg_per_m3_to_g_per_cm3(material_density_kg_per_m3)
    total_bar_length = bars_needed * standard_bar_length
    volume = area * total_bar_length  # mm^3
    volume_cm3 = volume / 1000.0
    total_weight = (volume_cm3 * material_density) / 1000.0  # kg
    return total_weight if total_weight > 0 else 0.0

# 4. 절단 효율 계산
# related_columns: productLength, cuttingLoss, headCut, tailCut, quantity, standardBarLength, barsNeeded
def calculate_utilization_rate(data):
    product_length = parse_float_safe(data.get('productLength'))
    cutting_loss = parse_float_safe(data.get('cuttingLoss'))
    head_cut = parse_float_safe(data.get('headCut'))
    tail_cut = parse_float_safe(data.get('tailCut'))
    quantity = parse_float_safe(data.get('quantity'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    bars_needed = parse_float_safe(data.get('barsNeeded'))
    unit_length = product_length + cutting_loss
    used_length = quantity * unit_length
    usable_length = standard_bar_length - head_cut - tail_cut
    total_usable_length = bars_needed * usable_length
    if total_usable_length <= 0:
        return 0.0
    utilization_rate = (used_length / total_usable_length) * 100.0
    return utilization_rate if utilization_rate > 0 else 0.0

# 5. 총 재료비 계산
# related_columns: totalWeight, materialPrice
def calculate_total_cost(data):
    total_weight = parse_float_safe(data.get('totalWeight'))
    material_price = parse_float_safe(data.get('materialPrice'))
    total_cost = total_weight * material_price
    return total_cost if total_cost > 0 else 0.0

# 6. 개당 단가 계산
# related_columns: totalCost, quantity
def calculate_unit_cost(data):
    total_cost = parse_float_safe(data.get('totalCost'))
    quantity = parse_float_safe(data.get('quantity'))
    if quantity <= 0:
        return 0.0
    unit_cost = total_cost / quantity
    return unit_cost if unit_cost > 0 else 0.0

# 7. 손실률 계산
# related_columns: utilizationRate
def calculate_wastage(data):
    utilization_rate = parse_float_safe(data.get('utilizationRate'))
    wastage = 100.0 - utilization_rate
    return wastage if wastage > 0 else 0.0


