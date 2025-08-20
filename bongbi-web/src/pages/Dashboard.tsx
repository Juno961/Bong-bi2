import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart3,
  Calculator,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getMaterialDisplayName, getMaterialDefaults } from "@/data/materialDefaults";
import { WelcomeGuide, GuideStep } from "@/components/ui/onboarding-tour";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  barsNeeded: number;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  standardBarLength: number;
  totalCost: number;
  unitCost: number;
  utilizationRate: number;
  timestamp: Date;
  isPlate?: boolean;
}

const Dashboard = () => {
  const [recentCalculations, setRecentCalculations] = useState<OrderItem[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    monthlyWorkload: 0,
    monthlyCost: 0,
    utilizationRate: 0,
    scrapRate: 0,
    monthlyWorkloadChange: 0,
    monthlyCostChange: 0,
    utilizationRateChange: 0,
    scrapRateChange: 0,
  });
  const [materialUsageData, setMaterialUsageData] = useState<{ material: string; usage: number }[]>([]);

  // Calculate dashboard metrics from saved orders
  const calculateDashboardMetrics = (orders: OrderItem[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter orders for current month and previous month
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousMonthYear;
    });

    // Calculate current month metrics
    const monthlyWorkload = currentMonthOrders.length;
    const monthlyCost = currentMonthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
    const utilizationRate = currentMonthOrders.length > 0
      ? currentMonthOrders.reduce((sum, order) => sum + (order.utilizationRate || 0), 0) / currentMonthOrders.length
      : 0;
    const scrapRate = 100 - utilizationRate;

    // Calculate previous month metrics for comparison
    const prevMonthlyWorkload = previousMonthOrders.length;
    const prevMonthlyCost = previousMonthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
    const prevUtilizationRate = previousMonthOrders.length > 0
      ? previousMonthOrders.reduce((sum, order) => sum + (order.utilizationRate || 0), 0) / previousMonthOrders.length
      : 0;
    const prevScrapRate = 100 - prevUtilizationRate;

    // Calculate percentage changes
    const monthlyWorkloadChange = prevMonthlyWorkload > 0
      ? ((monthlyWorkload - prevMonthlyWorkload) / prevMonthlyWorkload) * 100
      : 0;
    const monthlyCostChange = prevMonthlyCost > 0
      ? ((monthlyCost - prevMonthlyCost) / prevMonthlyCost) * 100
      : 0;
    const utilizationRateChange = prevUtilizationRate > 0
      ? utilizationRate - prevUtilizationRate
      : 0;
    const scrapRateChange = prevScrapRate > 0
      ? scrapRate - prevScrapRate
      : 0;

    return {
      monthlyWorkload,
      monthlyCost,
      utilizationRate,
      scrapRate,
      monthlyWorkloadChange,
      monthlyCostChange,
      utilizationRateChange,
      scrapRateChange,
    };
  };

  // Calculate material usage data from saved orders
  const calculateMaterialUsageData = (orders: OrderItem[]) => {
    const materialUsage: Record<string, number> = {};

    orders.forEach(order => {
      const materialDefaults = getMaterialDefaults(order.materialType);
      if (materialDefaults) {
        const displayName = getMaterialDisplayName(order.materialType);
        const weight = order.totalWeight || 0;

        if (materialUsage[displayName]) {
          materialUsage[displayName] += weight;
        } else {
          materialUsage[displayName] = weight;
        }
      }
    });

    // Convert to array and sort by usage (descending)
    return Object.entries(materialUsage)
      .map(([material, usage]) => ({ material, usage: Math.round(usage) }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8); // Show top 8 materials
  };

  // Load recent calculations and calculate metrics from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("savedOrders");
    if (stored) {
      try {
        const orders = JSON.parse(stored).map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp),
        }));

        // Sort by timestamp, newest first, and take only first 3 for recent calculations
        const recentOrders = orders
          .sort((a: OrderItem, b: OrderItem) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 3);
        setRecentCalculations(recentOrders);

        // Calculate dashboard metrics
        const metrics = calculateDashboardMetrics(orders);
        setDashboardMetrics(metrics);

        // Calculate material usage data
        const materialData = calculateMaterialUsageData(orders);
        setMaterialUsageData(materialData);
      } catch (error) {
        console.error("Failed to load recent calculations:", error);
      }
    }
  }, []);

  const getShapeDisplayName = (shape: string) => {
    switch (shape) {
      case "circle":
        return "원봉";
      case "hexagon":
        return "육각봉";
      case "square":
        return "정사각봉";
      case "rectangle":
        return "직사각봉";
      default:
        return shape;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + " 원";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            안녕하세요, 봉비서입니다
          </h1>
          <p className="text-muted-foreground font-medium">
            CNC 재료 계산 및 공장 효율성 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-modern hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                이번 달 작업량
              </CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardMetrics.monthlyWorkload}</div>
              <p className="text-xs text-muted-foreground font-medium">
                지난 달 대비 {dashboardMetrics.monthlyWorkloadChange >= 0 ? '+' : ''}{dashboardMetrics.monthlyWorkloadChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                이번 달 소재비
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₩{new Intl.NumberFormat("ko-KR").format(Math.round(dashboardMetrics.monthlyCost))}</div>
              <p className="text-xs text-muted-foreground font-medium">
                지난 달 대비 {dashboardMetrics.monthlyCostChange >= 0 ? '+' : ''}{dashboardMetrics.monthlyCostChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                소재 활용률
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{dashboardMetrics.utilizationRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground font-medium">
                {dashboardMetrics.utilizationRateChange >= 0 ? '+' : ''}{dashboardMetrics.utilizationRateChange.toFixed(1)}%
                {dashboardMetrics.utilizationRateChange >= 0 ? ' 개선' : ' 감소'}
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                평균 스크랩률
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{dashboardMetrics.scrapRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground font-medium">
                지난 달 대비 {dashboardMetrics.scrapRateChange >= 0 ? '+' : ''}{dashboardMetrics.scrapRateChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                바로가기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/calculator">
                <Button className="w-full justify-between" size="lg">
                  새로 계산하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline" className="w-full justify-between">
                  주문 내역 보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" className="w-full justify-between">
                  소재 설정
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Calculations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                최근 계산 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCalculations.length > 0 ? (
                  recentCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{calc.productName}</p>
                          <Badge variant="secondary">
                            {getMaterialDisplayName(calc.materialType)}
                          </Badge>
                          {!calc.isPlate && (
                            <Badge variant="outline" className="text-xs">
                              {getShapeDisplayName(calc.shape)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {calc.isPlate ? (
                            <>
                              {calc.plateThickness} × {calc.plateWidth} × {calc.plateLength} • {calc.quantity}장
                            </>
                          ) : (
                            <>
                              {calc.shape === "rectangle" && calc.width && calc.height
                                ? `${calc.width} × ${calc.height}mm`
                                : `⌀${calc.diameter}mm`} • {calc.quantity}개
                            </>
                          )} • {formatDate(calc.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(calc.totalCost)}</p>
                        <p className="text-xs text-muted-foreground">
                          총 소재비
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <WelcomeGuide
                    title="첫 계산을 시작해보세요!"
                    description="아직 계산 내역이 없습니다. 봉비서로 CNC 재료 계산을 시작해보세요."
                    className="border-0 bg-transparent"
                  >
                    <GuideStep
                      number={1}
                      title="계산기로 이동"
                      description="자재 계산기에서 첫 계산을 진행하세요"
                      action={() => window.location.href = '/calculator'}
                    />
                    <GuideStep
                      number={2}
                      title="재료와 치수 입력"
                      description="사용할 재료와 제품 치수를 입력하세요"
                    />
                    <GuideStep
                      number={3}
                      title="결과 확인"
                      description="계산 결과와 견적을 확인하고 저장하세요"
                    />
                  </WelcomeGuide>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="w-full">
                    모든 내역 보기
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Material Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              소재별 사용량 추이 (단위 : kg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materialUsageData.length > 0 ? (
              <ChartContainer
                config={{
                  usage: {
                    label: "사용량 (kg)",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-64"
              >
                <BarChart data={materialUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="material"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="usage"
                    fill="var(--color-usage)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>아직 소재 사용 데이터가 없습니다</p>
                  <p className="text-xs">계산기에서 주문을 저장하면 데이터가 표시됩니다</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
