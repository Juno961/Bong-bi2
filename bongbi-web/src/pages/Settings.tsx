import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings as SettingsIcon,
  RotateCcw,
  Plus,
  X,
  Calculator,
  Database,
} from "lucide-react";
import { materialDefaults, MaterialDefaults } from "@/data/materialDefaults";

interface EditableMaterial extends MaterialDefaults {
  id: string;
  isNew?: boolean;
}

const Settings = () => {
  // Convert materialDefaults to editable format
  const [materials, setMaterials] = useState<EditableMaterial[]>(
    Object.entries(materialDefaults).map(([key, data]) => ({
      id: key,
      ...data,
    })),
  );

  // Load custom material defaults from localStorage on mount
  useEffect(() => {
    const storedMaterials = localStorage.getItem("customMaterialDefaults");
    if (storedMaterials) {
      try {
        const customDefaults = JSON.parse(storedMaterials);
        const loadedMaterials = Object.entries(customDefaults).map(([key, data]) => ({
          id: key,
          ...(data as MaterialDefaults),
        }));
        setMaterials(loadedMaterials);
      } catch (error) {
        console.error("Failed to load custom material defaults:", error);
      }
    }
  }, []);

  // Calculation settings state
  const [calculationSettings, setCalculationSettings] = useState({
    autoCalculate: true,
    saveHistory: true,
    disablePlatePrice: false,
  });

  // Load calculation settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem("calculationSettings");
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        setCalculationSettings(settings);
      } catch (error) {
        console.error("Failed to load calculation settings:", error);
      }
    }
  }, []);

  // Save calculation settings to localStorage when they change
  const updateCalculationSetting = (key: string, value: boolean) => {
    const newSettings = { ...calculationSettings, [key]: value };
    setCalculationSettings(newSettings);
    localStorage.setItem("calculationSettings", JSON.stringify(newSettings));

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("calculationSettingsChanged", {
      detail: newSettings
    }));
  };

  // Default values state
  const [defaultValues, setDefaultValues] = useState({
    headCut: 20,
    tailCut: 250,
    scrapRatio: 100,
  });

  // Load default values from localStorage on mount
  useEffect(() => {
    const storedDefaults = localStorage.getItem("defaultValues");
    if (storedDefaults) {
      try {
        const defaults = JSON.parse(storedDefaults);
        setDefaultValues(defaults);
      } catch (error) {
        console.error("Failed to load default values:", error);
      }
    }
  }, []);

  // Save default values to localStorage when they change
  const updateDefaultValues = (newValues: typeof defaultValues) => {
    setDefaultValues(newValues);
    localStorage.setItem("defaultValues", JSON.stringify(newValues));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("defaultValuesChanged", {
      detail: newValues
    }));
  };

  const addMaterial = () => {
    const newMaterial: EditableMaterial = {
      id: `new_${Date.now()}`,
      material: "",
      standard_bar_length: 3000,
      material_density: 7.85,
      bar_unit_price: 0,
      plate_unit_price: 0,
      scrap_unit_price: 0,
      isNew: true,
    };
    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    
    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);
    
    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter((material) => material.id !== id);
    setMaterials(updatedMaterials);
    
    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);
    
    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  const updateMaterial = (
    id: string,
    field: keyof MaterialDefaults,
    value: string | number,
  ) => {
    const updatedMaterials = materials.map((material) =>
      material.id === id ? { ...material, [field]: value } : material,
    );
    setMaterials(updatedMaterials);
    
    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);
    
    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  const resetToDefaults = () => {
    const confirmed = window.confirm(
      "모든 설정을 기본값으로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    );
    if (confirmed) {
      try {
        // 기본 재료 설정으로 복원
        const defaultMaterials = Object.entries(materialDefaults).map(([key, data]) => ({
          id: key,
          ...data,
        }));
        setMaterials(defaultMaterials);
        
        // 기본 계산 설정으로 복원
        const defaultCalculationSettings = {
          autoCalculate: true,
          saveHistory: true,
          disablePlatePrice: false,
        };
        setCalculationSettings(defaultCalculationSettings);
        
        // 기본값 복원
        const defaultDefaults = {
          headCut: 20,
          tailCut: 250,
          scrapRatio: 100,
        };
        setDefaultValues(defaultDefaults);
        
        // localStorage에서 커스텀 설정 제거 (기본값 사용하도록)
        localStorage.removeItem("customMaterialDefaults");
        localStorage.setItem("calculationSettings", JSON.stringify(defaultCalculationSettings));
        localStorage.setItem("defaultValues", JSON.stringify(defaultDefaults));
        
        // 모든 연결된 컴포넌트에 초기화 알림
        window.dispatchEvent(new CustomEvent("calculationSettingsChanged", {
          detail: defaultCalculationSettings
        }));
        window.dispatchEvent(new CustomEvent("defaultValuesChanged", {
          detail: defaultDefaults
        }));
        window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
          detail: Object.entries(materialDefaults).reduce((acc, [key, data]) => {
            acc[key] = data;
            return acc;
          }, {} as Record<string, MaterialDefaults>)
        }));
        
        alert("모든 설정이 기본값으로 초기화되었습니다!");
      } catch (error) {
        console.error("설정 초기화 중 오류 발생:", error);
        alert("설정 초기화 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };



  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">설정</h1>
          <p className="text-muted-foreground">
            재료 계산기 기본 설정 및 환경 설정을 구성하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default Values Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                기본값 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-head-cut">선두 로스 (mm)</Label>
                <Input
                  id="default-head-cut"
                  type="number"
                  value={defaultValues.headCut}
                  onChange={(e) => {
                    const newValues = {
                      ...defaultValues,
                      headCut: parseInt(e.target.value) || 0,
                    };
                    updateDefaultValues(newValues);
                  }}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-tail-cut">후미 로스 (mm)</Label>
                <Input
                  id="default-tail-cut"
                  type="number"
                  value={defaultValues.tailCut}
                  onChange={(e) => {
                    const newValues = {
                      ...defaultValues,
                      tailCut: parseInt(e.target.value) || 0,
                    };
                    updateDefaultValues(newValues);
                  }}
                  placeholder="250"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-scrap">스크랩 환산 비율 (%)</Label>
                <Input
                  id="default-scrap"
                  type="number"
                  value={defaultValues.scrapRatio}
                  onChange={(e) => {
                    const newValues = {
                      ...defaultValues,
                      scrapRatio: parseInt(e.target.value) || 0,
                    };
                    updateDefaultValues(newValues);
                  }}
                  placeholder="100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Calculation Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                계산 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">실시간 자동 계산</Label>
                  <p className="text-sm text-muted-foreground">
                    입력 변경 시 즉시 자동으로 계산합니다. 비활성화하면 '계산하기' 버튼 클릭 시에만 계산됩니다.
                  </p>
                </div>
                <Switch
                  checked={calculationSettings.autoCalculate}
                  onCheckedChange={(checked) =>
                    updateCalculationSetting("autoCalculate", checked)
                  }
                />
              </div>

              <Separator />



              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">계산 이력 저장</Label>
                  <p className="text-sm text-muted-foreground">
                    모든 계산 내역을 기록으로 보관합니다
                  </p>
                </div>
                <Switch
                  checked={calculationSettings.saveHistory}
                  onCheckedChange={(checked) =>
                    updateCalculationSetting("saveHistory", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    판재 단가 비활성화
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    활성화 시 플레이트 계산에 봉재 가격을 사용합니다
                  </p>
                </div>
                <Switch
                  checked={calculationSettings.disablePlatePrice}
                  onCheckedChange={(checked) =>
                    updateCalculationSetting("disablePlatePrice", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Material Defaults Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
              소재 기본값 설정
              </CardTitle>
              <Button
                onClick={addMaterial}
                className="btn-modern rounded-xl"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
              추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>재료명</TableHead>
                    <TableHead>표준 길이 (mm)</TableHead>
                    <TableHead>밀도 (g/cm³)</TableHead>
                    <TableHead>봉재 단가 (₩/kg)</TableHead>
                    <TableHead
                      className={
                        calculationSettings.disablePlatePrice
                          ? "opacity-50"
                          : ""
                      }
                    >
                      판재 단가 (₩/kg)
                    </TableHead>
                    <TableHead>스크랩 단가 (₩/kg)</TableHead>
                    <TableHead className="w-16">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="py-2">
                        <Input
                          value={material.material}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "material",
                              e.target.value,
                            )
                          }
                          placeholder="재료명"
                          className="h-8 text-sm border-gray-200 focus:border-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          value={material.standard_bar_length}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "standard_bar_length",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="3000"
                          className="h-8 text-sm border-gray-200 focus:border-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={material.material_density}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "material_density",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="7.85"
                          className="h-8 text-sm border-gray-200 focus:border-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          value={material.bar_unit_price}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "bar_unit_price",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="8500"
                          className="h-8 text-sm border-gray-200 focus:border-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          value={material.plate_unit_price}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "plate_unit_price",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="8500"
                          className={`h-8 text-sm border-gray-200 focus:border-blue-500 ${calculationSettings.disablePlatePrice ? "opacity-50" : ""}`}
                          disabled={calculationSettings.disablePlatePrice}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          value={material.scrap_unit_price}
                          onChange={(e) =>
                            updateMaterial(
                              material.id,
                              "scrap_unit_price",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="6800"
                          className="h-8 text-sm border-gray-200 focus:border-blue-500"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMaterial(material.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {calculationSettings.disablePlatePrice && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>플레이트 가격 컬럼이 비활성화되었습니다.</strong>{" "}
                  플레이트 계산 시 봉재 단가가 사용됩니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
