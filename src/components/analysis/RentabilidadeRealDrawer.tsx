import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface RentabilidadeRealDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  totalInvested: number;
  formatCurrency: (value: number) => string;
  economicIndicators: any;
}

const PERIOD_FILTERS = ['ESCOLHER', '3 MESES', '6 MESES', '12 MESES'];

export default function RentabilidadeRealDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  totalInvested,
  formatCurrency,
  economicIndicators
}: RentabilidadeRealDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [activeTab, setActiveTab] = useState<'carteira' | 'ativos'>('carteira');
  const [selectedPeriod, setSelectedPeriod] = useState('12 MESES');

  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.44;
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 13.08;
  
  // Real return = nominal return - inflation
  const realReturn = returnPercent - ipca12m;
  const cdiPercent = cdi12m > 0 ? (returnPercent / cdi12m) * 100 : 0;

  // Chart data for donut
  const chartData = [
    { name: 'Rent. Real', value: Math.max(0, realReturn), color: 'hsl(190, 70%, 50%)' },
    { name: 'Rent. Total', value: Math.max(0, returnPercent - realReturn), color: 'hsl(160, 60%, 45%)' },
  ];

  const getPeriodLabel = () => {
    const today = new Date();
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    
    return `De ${startDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })} até ${today.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Rentabilidade Real</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['carteira', 'ativos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'carteira' ? 'Carteira' : 'Ativos'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'carteira' ? (
              <>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-center font-medium text-foreground mb-4">Rentabilidade Total x Real</h3>
                  
                  {/* Donut Chart */}
                  <div className="h-56 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm text-muted-foreground">Do início</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(190, 70%, 50%)' }} />
                      <span className="text-sm text-muted-foreground">Rent. Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(160, 60%, 45%)' }} />
                      <span className="text-sm text-muted-foreground">Rent. Total</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rent. Real</p>
                      <p className={`text-lg font-bold ${realReturn >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {realReturn.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rent. Total:</p>
                      <p className="text-lg font-bold text-emerald-500">{returnPercent.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Sobre CDI:</p>
                      <p className="text-lg font-bold text-foreground">{cdiPercent.toFixed(2)}%</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground text-center">
                      A rentabilidade real é o rendimento da sua carteira descontando a inflação.
                    </p>
                  </div>
                </div>

                {/* Links */}
                <button className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <span className="font-medium text-foreground">Rentabilidade real mensal</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <span className="font-medium text-foreground">Rentabilidade real anual</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                {/* Period Filters */}
                <div className="flex gap-2 mb-2">
                  {PERIOD_FILTERS.map((period) => (
                    <button
                      key={period}
                      onClick={() => period !== 'ESCOLHER' && setSelectedPeriod(period)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedPeriod === period
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground text-center mb-4">{getPeriodLabel()}</p>

                {/* Assets List */}
                {investments.map((inv) => {
                  const invReturn = inv.gain_percent;
                  const invRealReturn = invReturn - ipca12m;
                  const invCdiPercent = cdi12m > 0 ? (invReturn / cdi12m) * 100 : 0;

                  return (
                    <div key={inv.id} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-6 rounded-full bg-primary" />
                        <span className="font-medium text-foreground">{inv.asset_name}</span>
                      </div>
                      <div className="border-t border-border pt-3 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rent. Real</p>
                          <p className={`font-bold ${invRealReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {invRealReturn.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rent. Total:</p>
                          <p className="font-bold text-emerald-500">{invReturn.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Sobre CDI:</p>
                          <p className="font-bold text-foreground">{invCdiPercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Close Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => onOpenChange(false)}
              className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
