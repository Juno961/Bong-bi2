import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MaterialForm } from "@/components/calculator/MaterialForm";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { SavedOrdersSection } from "@/components/calculator/SavedOrdersSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Save, Download, Share } from "lucide-react";
import { toast } from "sonner";
import { calculateRodMaterial, calculatePlateMaterial, getMaterialProperties } from "@/lib/materialCalculations";

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
}

const Calculator = () => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
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

  // Note: Temporary orders are now managed by SavedOrdersSection with localStorage
  // and will persist during browser session until manually deleted

  // Use dynamic material data from form inputs

  const calculateMaterials = (data: MaterialFormData) => {
    setCurrentFormData(data);

    // Check required fields based on material type
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

    setIsCalculating(true);

    // Simulate calculation delay
    setTimeout(() => {
      const quantity = parseInt(data.quantity) || 0;
      const materialDensity = parseFloat(data.materialDensity) || 7.85; // g/cm³

      if (activeTab === "sheet") {
        // Plate calculation logic using utility function
        const thickness = parseFloat(data.plateThickness) || 0;
        const width = parseFloat(data.plateWidth) || 0;
        const length = parseFloat(data.plateLength) || 0;

        // Get material properties from form data or defaults
        const materialProperties = getMaterialProperties(data.materialType);
        const plateUnitPrice = parseFloat(data.plateUnitPrice) || materialProperties.plateUnitPrice;

        const calculationResults = calculatePlateMaterial({
          thickness,
          width,
          length,
          quantity,
          materialDensity,
          plateUnitPrice,
        });

        setResults(calculationResults);
        setIsCalculating(false);
      } else {
        // Rod calculation logic using utility function
        const diameter = parseFloat(data.diameter) || 0;
        const width = data.width ? parseFloat(data.width) : undefined;
        const height = data.height ? parseFloat(data.height) : undefined;
        const productLength = parseFloat(data.productLength) || 0;
        const cuttingLoss = parseFloat(data.cuttingLoss) || 0;
        const headCut = parseFloat(data.headCut) || 20;
        const tailCut = parseFloat(data.tailCut) || 250;
        // Get material properties from form data or defaults
        const materialProperties = getMaterialProperties(data.materialType);
        const standardBarLength = parseFloat(data.standardBarLength) || materialProperties.standardBarLength;
        const materialPrice = parseFloat(data.materialPrice) || materialProperties.barUnitPrice;
        const productWeight = parseFloat(data.productWeight) || 0;
        const actualProductWeight = parseFloat(data.actualProductWeight) || 0;

        // 사용자가 스크랩 환산 비율을 직접 입력한 경우에만 사용 (기본값 사용하지 않음)
        let recoveryRatio = 0;
        if (data.recoveryRatio && data.recoveryRatio.trim() !== "") {
          const userRecoveryRatio = parseFloat(data.recoveryRatio);
          if (!isNaN(userRecoveryRatio) && userRecoveryRatio > 0) {
            recoveryRatio = userRecoveryRatio;
          }
        }

        // 사용자가 스크랩 단가를 직접 입력한 경우에만 사용 (기본값 사용하지 않음)
        let scrapUnitPrice = 0;
        if (data.scrapUnitPrice && data.scrapUnitPrice.trim() !== "") {
          const userScrapPrice = parseFloat(data.scrapUnitPrice);
          if (!isNaN(userScrapPrice) && userScrapPrice > 0) {
            scrapUnitPrice = userScrapPrice;
          }
        }

        const calculationResults = calculateRodMaterial({
          shape: data.shape,
          diameter,
          width,
          height,
          productLength,
          quantity,
          cuttingLoss,
          headCut,
          tailCut,
          standardBarLength,
          materialDensity,
          materialPrice,
          recoveryRatio,
          productWeight: productWeight > 0 ? productWeight : undefined,
          actualProductWeight: actualProductWeight > 0 ? actualProductWeight : undefined,
          scrapUnitPrice,
        });

        setResults(calculationResults);
        setIsCalculating(false);
      }
    }, 300);
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
