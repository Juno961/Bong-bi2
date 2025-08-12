import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MaterialForm } from "@/components/calculator/MaterialForm";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { SavedOrdersSection } from "@/components/calculator/SavedOrdersSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Save, Download, Share, Loader2 } from "lucide-react";
import { toast } from "sonner";
// API 클라이언트로 대체
import {
  calculateRodMaterial,
  calculatePlateMaterial,
  getApiInfo,
  convertFormToRodRequest,
  convertFormToPlateRequest,
  type RodCalculateResponse,
  type PlateCalculateResponse,
} from "@/lib/api";

interface MaterialFormData {
  productName: string;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  productLength: string;
  cuttingLoss: string;
  headCut: string;
  tailCut: string;
  quantity: string;
  customer: string;
  productWeight: string;
  actualProductWeight: string; // 제품 실 중량 (사용자 입력)
  recoveryRatio: string;
  scrapUnitPrice: string;
  standardBarLength: string;
  materialDensity: string;
  materialPrice: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  plateUnitPrice: string;
}

interface CalculationResults {
  totalBarsNeeded: number;
  standardBarLength: number;
  materialCost: number;
  utilizationRate: number;
  scrapSavings: number;
  wastage: number;
  costPerPiece: number;
  totalWeight: number;
  realCost?: number;
  scrapWeight?: number;
}

const Calculator = () => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"rod" | "sheet">("rod");
  const [currentFormData, setCurrentFormData] =
    useState<MaterialFormData | null>(null);
  const savedOrdersRef = useRef<any>(null);
  const productNameUpdateRef = useRef<(() => void) | null>(null);

  // Load calculation settings to determine save behavior
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(false);

  useEffect(() => {
    const loadCalculationSettings = () => {
      const storedSettings = localStorage.getItem("calculationSettings");
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings);
          setAutoSaveEnabled(settings.saveHistory || false);
          setSaveHistoryEnabled(settings.saveHistory || false);
        } catch (error) {
          console.error("Failed to load calculation settings:", error);
        }
      }
    };

    loadCalculationSettings();

    // Listen for storage changes (when settings are updated in different tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "calculationSettings") {
        loadCalculationSettings();
      }
    };

    // Listen for custom event (when settings are updated in same tab)
    const handleSettingsChange = (e: CustomEvent) => {
      setAutoSaveEnabled(e.detail.saveHistory || false);
      setSaveHistoryEnabled(e.detail.saveHistory || false);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("calculationSettingsChanged", handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("calculationSettingsChanged", handleSettingsChange as EventListener);
    };
  }, []);

  // API 연결 상태 확인
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        await getApiInfo();
        setApiConnected(true);
        toast.success("백엔드 서버에 성공적으로 연결되었습니다!");
      } catch (error) {
        setApiConnected(false);
        toast.error("백엔드 서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.");
        console.error("API 연결 오류:", error);
      }
    };

    checkApiConnection();
  }, []);

  // Note: Temporary orders are now managed by SavedOrdersSection with localStorage
  // and will persist during browser session until manually deleted

  // Use dynamic material data from form inputs

  const calculateMaterials = async (data: MaterialFormData) => {
    setCurrentFormData(data);

    // 기본 유효성 검사
    const isRodValid =
      activeTab === "rod" &&
      data.shape &&
      ((data.shape === "rectangle" && data.width && data.height) ||
        (data.shape !== "rectangle" && data.diameter)) &&
      data.productLength &&
      data.quantity &&
      data.materialType;
    const isSheetValid =
      activeTab === "sheet" &&
      data.plateThickness &&
      data.plateWidth &&
      data.plateLength &&
      data.quantity &&
      data.materialType;

    if (!isRodValid && !isSheetValid) {
      setResults(null);
      return;
    }

    if (apiConnected === false) {
      toast.error("백엔드 서버에 연결되지 않았습니다.");
      return;
    }

    setIsCalculating(true);
    try {
      if (activeTab === "sheet") {
        const plateReq = convertFormToPlateRequest(data);
        const resp: PlateCalculateResponse = await calculatePlateMaterial(plateReq);
        const calculationResults: CalculationResults = {
          totalBarsNeeded: 0,
          standardBarLength: 0,
          materialCost: resp.totalCost,
          utilizationRate: resp.utilizationRate,
          scrapSavings: resp.scrapSavings,
          wastage: resp.wastage,
          costPerPiece: resp.unitCost,
          totalWeight: resp.totalWeight,
          realCost: resp.realCost,
        };
        setResults(calculationResults);
      } else {
        const rodReq = convertFormToRodRequest(data);
        const resp: RodCalculateResponse = await calculateRodMaterial(rodReq);
        const calculationResults: CalculationResults = {
          totalBarsNeeded: resp.barsNeeded,
          standardBarLength: parseFloat(data.standardBarLength) || 0,
          materialCost: resp.totalCost,
          utilizationRate: resp.utilizationRate,
          scrapSavings: resp.scrapSavings,
          wastage: resp.wastage,
          costPerPiece: resp.unitCost,
          totalWeight: resp.totalWeight,
          realCost: resp.realCost,
          scrapWeight: (resp as any).scrapWeight,
        };
        setResults(calculationResults);
      }
      toast.success("계산이 완료되었습니다!");
    } catch (error) {
      console.error("계산 오류:", error);
      toast.error(`계산 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveOrder = (orderData: any) => {
    if (savedOrdersRef.current) {
      savedOrdersRef.current(orderData);
    }
  };

  // Permanent save to OrderHistory (localStorage)
  const handlePermanentSave = () => {
    if (!results || !currentFormData) {
      return;
    }

    const newOrder = {
      id: Date.now().toString(),
      productName: currentFormData.productName || "제품-001",
      quantity: parseInt(currentFormData.quantity) || 0,
      barsNeeded: results.totalBarsNeeded,
      materialType: currentFormData.materialType,
      shape: currentFormData.shape || "",
      diameter: currentFormData.diameter || "",
      width: currentFormData.width || "",
      height: currentFormData.height || "",
      plateThickness: currentFormData.plateThickness || "",
      plateWidth: currentFormData.plateWidth || "",
      plateLength: currentFormData.plateLength || "",
      productLength: currentFormData.productLength || "",
      cuttingLoss: currentFormData.cuttingLoss || "",
      headCut: currentFormData.headCut || "",
      tailCut: currentFormData.tailCut || "",
      customer: currentFormData.customer || "",
      productWeight: currentFormData.productWeight || "",
      actualProductWeight: currentFormData.actualProductWeight || "",
      recoveryRatio: currentFormData.recoveryRatio || "",
      scrapUnitPrice: currentFormData.scrapUnitPrice || "",
      scrapPrice: currentFormData.scrapPrice || "",
      standardBarLength: results.standardBarLength,
      materialDensity: currentFormData.materialDensity || "",
      materialPrice: currentFormData.materialPrice || "",
      plateUnitPrice: currentFormData.plateUnitPrice || "",
      totalCost: results.materialCost,
      unitCost: results.costPerPiece,
      utilizationRate: activeTab === "sheet" ? 100 : results.utilizationRate,
      scrapSavings: results.scrapSavings || 0,
      wastage: results.wastage || 0,
      totalWeight: results.totalWeight,
      timestamp: new Date(),
      isPlate: activeTab === "sheet",
    };

    // Save to localStorage for OrderHistory
    const existingOrders = JSON.parse(
      localStorage.getItem("savedOrders") || "[]",
    );
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

    // Update product name for next calculation after successful save
    if (productNameUpdateRef.current) {
      productNameUpdateRef.current();
    }

    // Show success message or feedback
    toast.success("계산 결과가 주문 내역에 영구 저장되었습니다!", {
      description: "주문 내역 메뉴에서 저장된 결과를 확인할 수 있습니다.",
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* Left Panel - Input Form (1/3 on desktop, full width on mobile) */}
        <div className="w-full lg:w-1/3 bg-[#F7F8FA] lg:border-r border-gray-200 flex flex-col">
          <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
            {/* Material Type Tab Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("rod")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  activeTab === "rod"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                봉재/각재
              </button>
              <button
                onClick={() => setActiveTab("sheet")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  activeTab === "sheet"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                판재
              </button>
            </div>
          </div>

          {/* Input Form - Scrollable */}
          <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6">
            <MaterialForm
              onCalculate={calculateMaterials}
              materialType={activeTab}
              onProductNameUpdate={(updateFn) => {
                productNameUpdateRef.current = updateFn;
              }}
            />
          </div>
        </div>

        {/* Right Panel - Results (2/3 on desktop, full width below input on mobile) */}
        <div className="w-full lg:w-2/3 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 lg:p-6 bg-[#F7F8FA] border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  계산 결과
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  실시간 자재 계산 및 견적
                </p>
              </div>
              {!saveHistoryEnabled && (
                <div className="hidden sm:flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePermanentSave}
                    disabled={!results}
                    className="text-gray-600 border-gray-300 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    계산결과 저장하기
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Saved Orders Section */}
          <div className="p-4 lg:p-6 border-b border-gray-200 bg-[#F7F8FA]">
            <SavedOrdersSection
              materialType={activeTab}
              onAddOrder={(addOrderFn) => {
                savedOrdersRef.current = addOrderFn;
              }}
            />
          </div>

          {/* Results Content - Scrollable */}
          <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6 bg-[#F7F8FA]">
            <ResultsPanel
              results={results}
              isCalculating={isCalculating}
              formData={currentFormData}
              onSaveOrder={handleSaveOrder}
              materialType={activeTab}
              autoSaveEnabled={autoSaveEnabled}
              saveHistoryEnabled={saveHistoryEnabled}
              onPermanentSave={handlePermanentSave}
              onProductNameUpdate={() => {
                if (productNameUpdateRef.current) {
                  productNameUpdateRef.current();
                }
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calculator;
