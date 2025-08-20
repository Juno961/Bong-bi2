import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  Recycle,
  Save,
  CheckCircle,
  ChevronDown,
  Calculator,
  Info,
  Edit3,
} from "lucide-react";
import { getMaterialDisplayName } from "@/data/materialDefaults";

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

interface FormData {
  productName: string;
  quantity: string;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  productLength: string;
  headCut: string;
  tailCut: string;
  cuttingLoss: string;
  customer: string;
  productWeight: string;
  actualProductWeight: string; // 제품 실 중량
  recoveryRatio: string;
  scrapUnitPrice: string;
  scrapPrice: string;
  standardBarLength: string;
  materialDensity: string;
  materialPrice: string;
  plateUnitPrice: string;
}

interface ResultsPanelProps {
  results: CalculationResults | null;
  isCalculating: boolean;
  formData?: FormData;
  onSaveOrder?: (orderData: any) => void;
  materialType?: "rod" | "sheet";
  autoSaveEnabled?: boolean;
  saveHistoryEnabled?: boolean;
  onPermanentSave?: () => void;
  onProductNameUpdate?: () => void;
}

export const ResultsPanel = ({
  results,
  isCalculating,
  formData,
  onSaveOrder,
  materialType = "rod",
  autoSaveEnabled = false,
  saveHistoryEnabled = false,
  onPermanentSave,
  onProductNameUpdate,
}: ResultsPanelProps) => {
  const [editableBarsNeeded, setEditableBarsNeeded] = useState<number>(0);
  const [isDetailedOpen, setIsDetailedOpen] = useState(false);

  // Update editableBarsNeeded when results change
  useEffect(() => {
    if (results) {
      setEditableBarsNeeded(results.totalBarsNeeded);
    }
  }, [results]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + " 원";
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(3)} kg`;
  };

  // Enhanced utilization grading system
  const getUtilizationGrade = (rate: number) => {
    if (rate >= 90)
      return {
        label: "완벽",
        emoji: "✅",
        color: "text-green-600 bg-green-50",
        bgColor: "bg-green-500",
      };
    if (rate >= 80)
      return {
        label: "좋음",
        emoji: "👍",
        color: "text-blue-600 bg-blue-50",
        bgColor: "bg-blue-500",
      };
    if (rate >= 70)
      return {
        label: "양호",
        emoji: "⚠️",
        color: "text-yellow-600 bg-yellow-50",
        bgColor: "bg-yellow-500",
      };
    if (rate >= 60)
      return {
        label: "경고",
        emoji: "⚠️",
        color: "text-orange-600 bg-orange-50",
        bgColor: "bg-orange-500",
      };
    return {
      label: "나쁨",
      emoji: "🚨",
      color: "text-red-600 bg-red-50",
      bgColor: "bg-red-500",
    };
  };

  const getMaterialTypeDisplay = (materialType: string) => {
    return getMaterialDisplayName(materialType);
  };

  const handleSaveOrder = () => {
    if (!results || !formData) return;

    const newOrder = {
      id: Date.now().toString(),
      productName: formData.productName || "제품-001",
      quantity: parseInt(formData.quantity) || 0,
      barsNeeded: editableBarsNeeded,
      materialType: formData.materialType,
      shape: formData.shape || "",
      diameter: formData.diameter || "",
      width: formData.width || "",
      height: formData.height || "",
      plateThickness: formData.plateThickness || "",
      plateWidth: formData.plateWidth || "",
      plateLength: formData.plateLength || "",
      // Include all additional form data
      productLength: formData.productLength || "",
      cuttingLoss: formData.cuttingLoss || "",
      headCut: formData.headCut || "",
      tailCut: formData.tailCut || "",
      customer: formData.customer || "",
      productWeight: formData.productWeight || "",
      actualProductWeight: formData.actualProductWeight || "",
      recoveryRatio: formData.recoveryRatio || "",
      scrapUnitPrice: formData.scrapUnitPrice || "",
      scrapPrice: formData.scrapPrice || "",
      standardBarLength: results.standardBarLength,
      materialDensity: formData.materialDensity || "",
      materialPrice: formData.materialPrice || "",
      plateUnitPrice: formData.plateUnitPrice || "",
      // Include all calculation results
      totalCost:
        materialType === "sheet"
          ? results.materialCost
          : results.materialCost *
            (editableBarsNeeded / results.totalBarsNeeded),
      unitCost: results.costPerPiece,
      utilizationRate:
        materialType === "sheet"
          ? 100
          : results.utilizationRate *
            (results.totalBarsNeeded / editableBarsNeeded),
      scrapSavings: results.scrapSavings || 0,
      wastage: results.wastage || 0,
      totalWeight: results.totalWeight,
      timestamp: new Date(),
      isPlate: materialType === "sheet",
    };

    if (autoSaveEnabled) {
      // Auto-save mode: Save to both permanent and temporary storage
      // 1. Save to localStorage (permanent storage)
      const existingOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]");
      const updatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

      // 2. Also save to temporary storage for display in '저장된 주문'
      if (onSaveOrder) {
        onSaveOrder(newOrder);
      }

      // 3. Update product name for next calculation after successful save
      if (onProductNameUpdate) {
        onProductNameUpdate();
      }

      toast.success("주문이 자동으로 영구 저장되었습니다!", {
        description: "주문 내역 메뉴에서 저장된 결과를 확인할 수 있습니다.",
      });
    } else {
      // Manual mode: Save to temporary storage only
      if (onSaveOrder) {
        onSaveOrder(newOrder);
      }
    }
  };

  if (isCalculating || !results) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              자재 사양을 입력하면 계산 결과를 확인할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate detailed metrics
  const cuttingLoss = parseFloat(formData?.cuttingLoss || "0");
  const headCut = parseFloat(formData?.headCut || "0");
  const tailCut = parseFloat(formData?.tailCut || "0");
  const unitLength = parseFloat(formData?.productLength || "0") + cuttingLoss;
  const usableBarLength = results.standardBarLength - headCut - tailCut;
  const quantity = parseInt(formData?.quantity || "1");

  const piecesPerBar = Math.floor(usableBarLength / unitLength);

  // Fix weight calculations:
  // results.totalWeight is already the total weight of all bars needed
  const barWeight = results.totalWeight / results.totalBarsNeeded; // Weight per bar in kg

  // Calculate individual product weight properly:
  // If user provided product weight, use it; otherwise calculate from material properties
  let individualProductWeight = 0; // in grams
  if (formData?.productWeight && parseFloat(formData.productWeight) > 0) {
    individualProductWeight = parseFloat(formData.productWeight);
  } else {
    // Calculate from material dimensions and density if available
    const density = parseFloat(formData?.materialDensity || "7.85"); // g/cm³
    const productLength = parseFloat(formData?.productLength || "0");

    if (formData?.shape && productLength > 0) {
      let crossSectionalArea = 0; // mm²

      if (formData.shape === "circle" && formData.diameter) {
        const diameter = parseFloat(formData.diameter);
        crossSectionalArea = Math.PI * Math.pow(diameter / 2, 2);
      } else if (formData.shape === "square" && formData.diameter) {
        const side = parseFloat(formData.diameter);
        crossSectionalArea = side * side;
      } else if (formData.shape === "rectangle" && formData.width && formData.height) {
        const width = parseFloat(formData.width);
        const height = parseFloat(formData.height);
        crossSectionalArea = width * height;
      } else if (formData.shape === "hexagon" && formData.diameter) {
        const diameter = parseFloat(formData.diameter);
        crossSectionalArea = ((3 * Math.sqrt(3)) / 2) * Math.pow(diameter / 2, 2);
      }

      // Volume in mm³ = area × length
      const volumeMm3 = crossSectionalArea * productLength;
      // Convert to cm³ and then to grams
      const volumeCm3 = volumeMm3 / 1000;
      individualProductWeight = volumeCm3 * density;
    }
  }

  // 봉재당 단가는 원재료 기준으로 고정 (스크랩과 무관)
  const pricePerBar = results.materialCost / Math.max(1, results.totalBarsNeeded);
  // 제품당 가격: 원가 기준과 실제(스크랩 반영 후) 나란히 표기
  const baseUnitPrice = results.costPerPiece;
  const realUnitPrice = results.realCost && quantity > 0 ? results.realCost / quantity : undefined;
  // 스크랩 계산 활성 상태: 스크랩 중량과 절약액이 유효할 때만 비교 표기
  const isScrapActive = (results.scrapWeight ?? 0) > 0 && (results.scrapSavings ?? 0) > 0;

  const grade = getUtilizationGrade(results.utilizationRate);

  return (
    <div className="space-y-6">
      {/* 1. Hero Section - 핵심 정보 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 총 재료비 - 가장 큰 텍스트 */}
              <div className="mb-4">
                <div className="text-lg text-gray-700 mb-1">💰 총 재료비</div>
                {isScrapActive && results.realCost ? (
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-gray-500 line-through">
                      {Math.round(results.materialCost).toLocaleString()}원
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      {Math.round(results.realCost).toLocaleString()}원
                    </div>
                    <div className="text-lg font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      -{Math.round(results.scrapSavings).toLocaleString()}원
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-gray-900">
                    {Math.round(results.materialCost).toLocaleString()}원
                  </div>
                )}
              </div>

              {/* 기본 정보 한줄 요약 */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-4">
                  <span>📦 {formData?.productName || "제품-001"}</span>
                  <span>{(parseInt(formData?.quantity || "0")).toLocaleString()}개</span>
                  {materialType === "rod" && (
                    <span>필요 봉재: {editableBarsNeeded}봉</span>
                  )}
                </div>
              </div>
            </div>

            {/* 저장 버튼 우상단 고정 */}
            <Button
              onClick={handleSaveOrder}
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              💾 저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Key Metrics Grid - 핵심 지표 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 제품당 가격 */}
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-gray-600 mb-2">제품당 가격</div>
            {isScrapActive && realUnitPrice !== undefined ? (
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-500 line-through">
                  {Math.round(baseUnitPrice).toLocaleString()}원
                </div>
                <div className="text-xl font-bold text-green-600">
                  {Math.round(realUnitPrice).toLocaleString()}원
                </div>
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-900">
                {Math.round(baseUnitPrice).toLocaleString()}원
              </div>
            )}
          </div>
        </Card>

        {/* 활용률 */}
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">{grade.emoji}</div>
            <div className="text-sm text-gray-600 mb-2">활용률</div>
            <div className="text-xl font-bold text-gray-900">
              {results.utilizationRate.toFixed(1)}%
            </div>
            <div className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1",
              grade.color
            )}>
              {grade.label}
            </div>
          </div>
        </Card>

        {/* 봉재당 생산 (봉재만) */}
        {materialType === "rod" ? (
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📏</div>
              <div className="text-sm text-gray-600 mb-2">봉재당 생산</div>
              <div className="text-xl font-bold text-blue-600">
                {piecesPerBar}개
              </div>
              {materialType === "rod" && (
                <div className="mt-2">
                  <Input
                    type="number"
                    value={editableBarsNeeded}
                    onChange={(e) => setEditableBarsNeeded(parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-sm text-center mx-auto"
                    min={results.totalBarsNeeded}
                  />
                  <div className="text-xs text-gray-500 mt-1">필요 봉재</div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📐</div>
              <div className="text-sm text-gray-600 mb-2">판재 정보</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(results.materialCost)}
              </div>
            </div>
          </Card>
        )}

        {/* 스크랩 절약 */}
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">♻️</div>
            <div className="text-sm text-gray-600 mb-2">스크랩 절약</div>
            {isScrapActive ? (
              <div className="text-xl font-bold text-green-600">
                {Math.round(results.scrapSavings).toLocaleString()}원
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-400">
                계산 안함
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Collapsible Details - 기본 접힘 */}
      <Card>
        <Collapsible open={isDetailedOpen} onOpenChange={setIsDetailedOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">
                    🔽 상세 정보 보기
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  isDetailedOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* 재료 규격 정보 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">📋 재료 규격 정보</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {materialType === "rod" ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-xs text-gray-600 mb-1">봉재 길이</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {results.standardBarLength}mm
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-xs text-gray-600 mb-1">단위 길이</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {unitLength.toFixed(1)}mm
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-xs text-gray-600 mb-1">사용 가능 길이</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {usableBarLength.toFixed(0)}mm
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-xs text-gray-600 mb-1">재료 타입</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {getMaterialTypeDisplay(formData?.materialType || "")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="text-xs text-gray-600 mb-1">판재 정보</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData?.plateThickness}×{formData?.plateWidth}×{formData?.plateLength}mm
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 길이/중량 상세 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">⚖️ 길이/중량 상세</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1">총 중량</div>
                    <div className="text-sm font-semibold text-blue-800">
                      {formatWeight(results.totalWeight)}
                    </div>
                  </div>
                  {materialType === "rod" && (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">봉재 중량</div>
                        <div className="text-sm font-semibold text-blue-800">
                          {barWeight.toFixed(3)}kg
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">제품 중량</div>
                        <div className="text-sm font-semibold text-blue-800">
                          {individualProductWeight.toFixed(1)}g
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 계산 공식 (봉재만) */}
              {materialType === "rod" && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">🧮 계산 공식</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <Info className="h-4 w-4 inline mr-1" />
                      <strong>단위 길이:</strong> 제품 길이 ({formData?.productLength}mm) + 절삭 손실 ({cuttingLoss.toFixed(1)}mm) = {unitLength.toFixed(1)}mm
                      <br />
                      <strong>사용 가능 길이:</strong> 봉재 길이 ({results.standardBarLength}mm) - 헤드 절삭 ({headCut}mm) - 테일 절삭 ({tailCut}mm) = {usableBarLength.toFixed(1)}mm
                    </p>
                  </div>
                </div>
              )}

              {/* 스크랩 분석 (해당시) */}
              {results.scrapWeight !== undefined && results.scrapWeight > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-800">♻️ 스크랩 분석</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-green-700 mb-1">스크랩 중량</div>
                      <div className="text-sm font-semibold text-green-800">
                        {results.scrapWeight.toFixed(3)}kg
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-green-700 mb-1">스크랩 절약액</div>
                      <div className="text-sm font-semibold text-green-800">
                        {formatCurrency(results.scrapSavings)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-green-700 mb-1">실제 재료비</div>
                      <div className="text-sm font-semibold text-green-800">
                        {results.realCost ? formatCurrency(results.realCost) : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
