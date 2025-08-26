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

  const pricePerBar = results.materialCost / results.totalBarsNeeded;
  const pricePerProduct = results.costPerPiece;

  const grade = getUtilizationGrade(results.utilizationRate);

  return (
    <div className="space-y-4">
      {/* Professional Results Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">계산 요약</CardTitle>
            <Button
              onClick={handleSaveOrder}
              className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Results Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제품명</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">수량</th>
                  {materialType === "rod" && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">필요 봉재</th>
                  )}
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">단가</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-blue-700 bg-blue-50">총 재료비</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {formData?.productName || "제품-001"}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 font-mono">
                    {(formData?.quantity || 0).toLocaleString()} {materialType === "sheet" ? "장" : "개"}
                  </td>
                  {materialType === "rod" && (
                    <td className="px-4 py-4 text-center text-sm text-gray-900">
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          value={editableBarsNeeded}
                          onChange={(e) =>
                            setEditableBarsNeeded(parseInt(e.target.value) || 0)
                          }
                          className="w-16 h-8 text-sm text-center border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono"
                          min={results.totalBarsNeeded}
                        />
                        <span className="text-gray-500 text-sm font-medium">봉</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4 text-right text-sm text-gray-900 font-mono">
                    {Math.round(results.costPerPiece).toLocaleString()}원
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-blue-700 font-mono bg-blue-50">
                    {results.realCost ? (
                      <div>
                        <div className="text-sm line-through text-gray-500">
                          {Math.round(results.materialCost).toLocaleString()}원
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {Math.round(results.realCost).toLocaleString()}원
                        </div>
                      </div>
                    ) : (
                      <div>{Math.round(results.materialCost).toLocaleString()}원</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Technical Data for Rods */}
          {materialType === "rod" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 font-medium">활용률</div>
                <div className="text-lg font-bold text-gray-900 font-mono">{results.utilizationRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 font-medium">봉재당 생산</div>
                <div className="text-lg font-bold text-gray-900 font-mono">{piecesPerBar} 개</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 font-medium">단위 길이</div>
                <div className="text-lg font-bold text-gray-900 font-mono">{unitLength.toFixed(1)} mm</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 font-medium">사용 가능 길이</div>
                <div className="text-lg font-bold text-gray-900 font-mono">{usableBarLength.toFixed(0)} mm</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Detail Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">재료 상세 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialType === "sheet" ? (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-xs text-blue-700 mb-1">총 가격</div>
              <div className="text-sm font-semibold text-blue-700">
                {formatCurrency(results.materialCost)}
              </div>
            </div>
          ) : (
            <>
              {/* 4 Grid Cards for Rod Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Card 1: 봉재당 생산 / 활용률 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        봉재당 생산
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {piecesPerBar} 개
                      </div>
                    </div>
                    <div className="border-t border-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">활용률</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {results.utilizationRate.toFixed(1)}%
                      </div>
                      <div
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-1",
                          grade.color,
                        )}
                      >
                        {grade.emoji} {grade.label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: 봉재 길이 / 단위 길이 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        봉재 길이
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {results.standardBarLength} mm
                      </div>
                    </div>
                    <div className="border-t border-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        단위 길이
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {unitLength.toFixed(1)} mm
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: 봉재 중량 / 제품 중량 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        봉재 중량
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {barWeight.toFixed(3)} kg
                      </div>
                    </div>
                    <div className="border-t border-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        제품 중량
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {individualProductWeight.toFixed(1)} g
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: 봉재당 가격 / 제품당 가격 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-xs text-blue-700 mb-1">
                        봉재당 가격
                      </div>
                      <div className="text-lg font-semibold text-blue-700">
                        {formatCurrency(pricePerBar)}
                      </div>
                    </div>
                    <div className="border-t border-blue-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-blue-700 mb-1">
                        제품당 가격
                      </div>
                      <div className="text-sm font-semibold text-blue-700">
                        {formatCurrency(pricePerProduct)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Length Formula Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <Info className="h-4 w-4 inline mr-1" />
                  <strong>단위 길이 계산:</strong> 제품 길이 (
                  <strong>{formData?.productLength}mm</strong>) + 절삭 손실 (
                  <strong>{cuttingLoss.toFixed(1)}mm</strong>) = <strong>{unitLength.toFixed(1)}mm</strong>
                  <br />
                  <strong>사용 가능 봉재 길이:</strong> 봉재 길이 (
                  <strong>{results.standardBarLength}mm</strong>) - 헤드 절삭 (
                  <strong>{headCut}mm</strong>) - 테일 절삭 (
                  <strong>{tailCut}mm</strong>) = <strong>{usableBarLength.toFixed(1)}mm</strong>
                </p>
              </div>
            </>
          )}

          {/* Scrap Information (if applicable for rods) */}
          {materialType === "rod" && results.scrapWeight !== undefined && results.scrapWeight > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Recycle className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-800">스크랩 계산 결과</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">스크랩 중량</div>
                  <div className="text-lg font-bold text-green-800">{results.scrapWeight.toFixed(3)} kg</div>
                </div>
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">스크랩 절약액</div>
                  <div className="text-lg font-bold text-green-800">{formatCurrency(results.scrapSavings)}</div>
                </div>
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">실제 재료비</div>
                  <div className="text-lg font-bold text-green-800">{results.realCost ? formatCurrency(results.realCost) : "-"}</div>
                </div>
              </div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Additional Details section for plates */}
      {materialType === "rod" && (
        <Card>
          <Collapsible open={isDetailedOpen} onOpenChange={setIsDetailedOpen}>
            <CollapsibleTrigger asChild>
              <div className="p-4 cursor-pointer hover:bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900 pl-5">
                    추가 상세 정보
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      isDetailedOpen && "rotate-180",
                    )}
                  />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      기본 수치
                    </h4>
                    <div className="bg-gray-50 rounded-lg py-2.5 px-4 space-y-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          총 중량
                        </span>
                        <span className="font-semibold text-gray-900 text-base">
                          {formatWeight(results.totalWeight)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {results.scrapWeight !== undefined && results.scrapWeight > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-800 text-sm">
                        스크랩 분석
                      </h4>
                      <div className="bg-green-50 rounded-lg py-2.5 px-4 space-y-2 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-700">
                            스크랩 중량
                          </span>
                          <span className="font-semibold text-green-900 text-base">
                            {results.scrapWeight.toFixed(3)} kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-700">
                            스크랩 절약액
                          </span>
                          <span className="font-semibold text-green-700 text-base">
                            {formatCurrency(results.scrapSavings)}
                          </span>
                        </div>
                        {results.realCost && (
                          <div className="flex justify-between items-center border-t border-green-200 pt-2">
                            <span className="text-sm font-medium text-green-700">
                              실제 재료비
                            </span>
                            <span className="font-semibold text-green-800 text-base">
                              {formatCurrency(results.realCost)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};
