// Material defaults based on material_defaults_v1.0.csv
export interface MaterialDefaults {
  material: string;
  standard_bar_length: number; // mm
  material_density: number; // g/cm³
  bar_unit_price: number; // KRW/kg
  plate_unit_price: number; // KRW/kg
  scrap_unit_price: number; // KRW/kg
  default_recovery_ratio: number; // % (기본 스크랩 환산비율)
}

export const materialDefaults: Record<string, MaterialDefaults> = {
  brass: {
    material: "황동",
    standard_bar_length: 2500,
    material_density: 8.5,
    bar_unit_price: 8000,
    plate_unit_price: 8000, // Same as bar price by default
    scrap_unit_price: 6400, // 80% of bar price
    default_recovery_ratio: 90, // 황동 기본 환산비율 90%
  },
  steel: {
    material: "SUM24L/S45C",
    standard_bar_length: 2500,
    material_density: 7.85,
    bar_unit_price: 7000,
    plate_unit_price: 7000,
    scrap_unit_price: 5600,
    default_recovery_ratio: 80, // 철강 기본 환산비율 80%
  },
  stainless_303: {
    material: "SUS303",
    standard_bar_length: 3000,
    material_density: 7.93,
    bar_unit_price: 8500,
    plate_unit_price: 8500,
    scrap_unit_price: 6800,
    default_recovery_ratio: 100, // 스테인리스 기본 환산비율 100%
  },
  stainless: {
    material: "SUS304",
    standard_bar_length: 2500,
    material_density: 7.93,
    bar_unit_price: 8500,
    plate_unit_price: 8500,
    scrap_unit_price: 6800,
    default_recovery_ratio: 100, // 스테인리스 기본 환산비율 100%
  },
  stainless_316: {
    material: "SUS316",
    standard_bar_length: 2500,
    material_density: 7.98,
    bar_unit_price: 9000,
    plate_unit_price: 9000,
    scrap_unit_price: 7200,
    default_recovery_ratio: 100, // 스테인리스 기본 환산비율 100%
  },
  aluminum: {
    material: "AL",
    standard_bar_length: 2500,
    material_density: 2.8,
    bar_unit_price: 4000,
    plate_unit_price: 4000,
    scrap_unit_price: 3200,
    default_recovery_ratio: 90, // 알루미늄 기본 환산비율 90%
  },
};

// Helper function to get material defaults by key
export const getMaterialDefaults = (
  materialKey: string,
): MaterialDefaults | null => {
  return materialDefaults[materialKey] || null;
};

// Helper function to get display name
export const getMaterialDisplayName = (materialKey: string): string => {
  const defaults = getMaterialDefaults(materialKey);
  return defaults ? defaults.material : materialKey;
};

// Helper function to get appropriate price based on material type
export const getMaterialPrice = (
  materialKey: string,
  materialType: "rod" | "sheet",
  disablePlatePrice: boolean = false,
): number => {
  const defaults = getMaterialDefaults(materialKey);
  if (!defaults) return 0;

  if (materialType === "sheet") {
    return disablePlatePrice
      ? defaults.bar_unit_price
      : defaults.plate_unit_price;
  }
  return defaults.bar_unit_price;
};
