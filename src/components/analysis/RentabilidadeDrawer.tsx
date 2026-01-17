import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface RentabilidadeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPatrimonio: number;
  totalInvested: number;
  formatCurrency: (value: number) => string;
  economicIndicators: any;
}

const PERIOD_FILTERS = ['ESCOLHER', '3 MESES', '6 MESES', '12 MESES'];

export default function RentabilidadeDrawer({
  open,
  onOpenChange,
  totalPatrimonio,
  totalInvested,
  formatCurrency,
  economicIndicators
}: RentabilidadeDrawerProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'mensal' | 'anual'>('geral');
  const [selectedPeriod, setSelectedPeriod] = useState('12 MESES');

  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 14.96;
  const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.44;
  const cdiPercent = cdi12m > 0 ? (returnPercent / cdi12m) * 100 : 0;

  // Generate chart data for line chart
  const generateChartData = () => {
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const data = [];
    
    for (let i = 0; i <= months; i++) {
      const progress = i / months;
      data.push({
        month: i,
        carteira: returnPercent * progress,
        cdi: cdi12m * progress,
        ipca: ipca12m * progress,
      });
    }
    return data;
  };

  // Generate monthly data
  const generateMonthlyData = () => {
    const today = new Date();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const progress = (12 - i) / 12;
      const monthValue = totalInvested + (totalGain * progress);
      const monthReturn = (returnPercent / 12) * (Math.random() * 0.5 + 0.75);
      const monthCdi = cdi12m / 12;
      const monthIpca = ipca12m / 12;
      
      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        saldoBruto: monthValue,
        rentabilidade: monthReturn,
        sobreCdi: (monthReturn / monthCdi) * 100,
        cdi: monthCdi,
        ipca: monthIpca,
      });
    }
    
    return months;
  };

  // Generate annual data
  const generateAnnualData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    return [
      {
        year: currentYear,
        rentNoAno: returnPercent * 0.1,
        rentAcumulada: returnPercent,
      },
      {
        year: currentYear - 1,
        rentNoAno: returnPercent * 0.9,
        rentAcumulada: returnPercent * 0.9,
      },
    ];
  };

  const chartData = generateChartData();
  const monthlyData = generateMonthlyData();
  const annualData = generateAnnualData();

  const getPeriodLabel = () => {
    const today = new Date();
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    
    return `De ${startDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })} a ${today.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Rentabilidade</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['geral', 'mensal', 'anual'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'geral' ? 'Geral' : tab === 'mensal' ? 'Mensal' : 'Anual'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'geral' && (
              <>
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

                  {/* Line Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cdi" stroke="hsl(280, 60%, 65%)" strokeWidth={2} dot={false} name="CDI" />
                        <Line type="monotone" dataKey="carteira" stroke="hsl(190, 80%, 50%)" strokeWidth={2} dot={false} name="Carteira" />
                        <Line type="monotone" dataKey="ipca" stroke="hsl(30, 80%, 55%)" strokeWidth={2} dot={false} name="IPCA" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Do Início */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-foreground mb-3">Do início</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rent. do período:</span>
                      <span className="font-semibold text-foreground">{returnPercent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CDI:</span>
                      <span className="font-medium text-foreground">{cdi12m.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IPCA:</span>
                      <span className="font-medium text-foreground">{ipca12m.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Mês Atual */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-foreground mb-3">Mês Atual</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rent. do período:</span>
                      <span className="font-semibold text-foreground">{(returnPercent / 12).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CDI:</span>
                      <span className="font-medium text-foreground">{(cdi12m / 12).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'mensal' && (
              <>
                {monthlyData.map((month, index) => (
                  <div key={index} className="bg-card border border-border rounded-2xl p-4">
                    <h3 className="font-semibold text-foreground mb-3">{month.month}</h3>
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Saldo Bruto Atual:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(month.saldoBruto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rentabilidade do Mês:</span>
                        <span className="font-medium text-foreground">{month.rentabilidade.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">% sobre o CDI:</span>
                        <span className="font-medium text-foreground">{month.sobreCdi.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CDI:</span>
                        <span className="font-medium text-foreground">{month.cdi.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">IPCA:</span>
                        <span className="font-medium text-foreground">{month.ipca.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'anual' && (
              <>
                {annualData.map((year, index) => (
                  <div key={index} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{year.year}</h3>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rent. no Ano:</span>
                        <span className="font-semibold text-foreground">{year.rentNoAno.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rent. Acumulada:</span>
                        <span className="font-medium text-foreground">{year.rentAcumulada.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
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
