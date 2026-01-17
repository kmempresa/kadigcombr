import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface EvolucaoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  totalInvested: number;
  formatCurrency: (value: number) => string;
  economicIndicators: any;
}

const PERIOD_FILTERS = ['ESCOLHER', '3 MESES', '6 MESES', '12 MESES'];

export default function EvolucaoDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  totalInvested,
  formatCurrency,
  economicIndicators
}: EvolucaoDrawerProps) {
  const [activeTab, setActiveTab] = useState<'acumulado' | 'historico'>('acumulado');
  const [selectedPeriod, setSelectedPeriod] = useState('12 MESES');

  // Calculate real return
  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  
  // CDI data from indicators
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 13.08;
  const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.44;
  const cdiPercent = cdi12m > 0 ? (returnPercent / cdi12m) * 100 : 0;

  // Generate chart data based on period
  const generateChartData = () => {
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const data = [];
    const today = new Date();
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      // Simulate gradual growth
      const progress = (months - i) / months;
      const value = totalInvested + (totalGain * progress);
      
      data.push({
        month: monthName,
        value: Math.round(value),
      });
    }
    return data;
  };

  // Generate monthly history data
  const generateHistoryData = () => {
    const today = new Date();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      // Estimate values
      const progress = (12 - i) / 12;
      const monthValue = totalInvested + (totalGain * progress);
      const monthReturn = returnPercent * progress / (12 - i || 1);
      const monthCdi = cdi12m / 12;
      const monthIpca = ipca12m / 12;
      
      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        saldoBruto: monthValue,
        valorAplicado: totalInvested,
        rentabilidade: monthReturn,
        rentSobreCdi: cdiPercent,
        rentDoCdi: monthCdi,
        rentIpca: monthIpca,
      });
    }
    
    return months;
  };

  const chartData = generateChartData();
  const historyData = generateHistoryData();

  const getPeriodLabel = () => {
    const today = new Date();
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    
    return `De ${startDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })} até ${today.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Evolução da Carteira</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['acumulado', 'historico'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'acumulado' ? 'Acumulado' : 'Histórico'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'acumulado' ? (
              <div className="p-4 space-y-4">
                {/* Chart Card */}
                <div className="bg-card border border-border rounded-2xl p-4">
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

                  {/* Area Chart */}
                  <div className="h-48 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(280, 60%, 65%)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(280, 60%, 65%)" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Valor']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(280, 60%, 65%)" 
                          strokeWidth={2}
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats */}
                  <div className="border-t border-border mt-4 pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Saldo Bruto Atual:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalPatrimonio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Aplicado:</span>
                      <span className="font-medium text-foreground">{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rentabilidade:</span>
                      <span className="font-medium text-foreground">{returnPercent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Primeira Aplicação:</span>
                      <span className="font-medium text-foreground">19.02.2025</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rent. sobre CDI:</span>
                        <span className="font-medium text-foreground">{cdiPercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Rent. do CDI:</span>
                        <span className="font-medium text-foreground">{cdi12m.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Rent. IPCA:</span>
                        <span className="font-medium text-foreground">{ipca12m.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {historyData.map((month, index) => (
                  <div key={index} className="bg-card border border-border rounded-2xl p-4">
                    <h3 className="font-semibold text-foreground mb-3">{month.month}</h3>
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Saldo Bruto Atual:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(month.saldoBruto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valor Aplicado:</span>
                        <span className="font-medium text-foreground">{formatCurrency(month.valorAplicado)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rentabilidade:</span>
                        <span className="font-medium text-foreground">{month.rentabilidade.toFixed(2)}%</span>
                      </div>
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rent. sobre CDI:</span>
                          <span className="font-medium text-foreground">{month.rentSobreCdi.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">Rent. do CDI:</span>
                          <span className="font-medium text-foreground">{month.rentDoCdi.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">Rent. IPCA:</span>
                          <span className="font-medium text-foreground">{month.rentIpca.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
