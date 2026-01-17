import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronLeft, ChevronRight, AlertCircle, Hand } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface ProventosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  formatCurrency: (value: number) => string;
}

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const PERIOD_FILTERS = ['ESCOLHER', '3 MESES', '6 MESES', '12 MESES'];

export default function ProventosDrawer({
  open,
  onOpenChange,
  investments,
  formatCurrency
}: ProventosDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [activeTab, setActiveTab] = useState<'agenda' | 'extrato' | 'historico' | 'ativos'>('agenda');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(0); // January = 0
  const [selectedPeriod, setSelectedPeriod] = useState('12 MESES');

  // For now, we'll show empty states since we don't have real proventos data
  // In a real implementation, this would come from the database
  const proventosData: { month: string; value: number }[] = [];
  const hasProventos = proventosData.length > 0;

  // Generate monthly proventos grid data (all zeros for empty state)
  const monthlyProventos = MONTHS.map((month, index) => ({
    month,
    value: 0,
    index,
  }));

  const getPeriodLabel = () => {
    const today = new Date();
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    
    return `De ${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()} até ${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <Hand className="w-10 h-10 text-muted-foreground/50" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mt-4 text-center">
        Opa! Você ainda não recebeu proventos.
      </h3>
      <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
        Fique tranquilo. Assim que receber o primeiro provento poderá acompanhar por aqui.
      </p>
    </div>
  );

  // Chart empty state
  const ChartEmptyState = () => (
    <div className="h-48 bg-muted/30 rounded-xl flex flex-col items-center justify-center">
      <svg className="w-32 h-12 text-muted-foreground/30" viewBox="0 0 128 48">
        <path
          d="M0 40 Q16 35, 32 38 T64 30 T96 35 T128 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M0 45 Q16 40, 32 42 T64 35 T96 40 T128 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.5"
        />
      </svg>
      <p className="text-sm text-muted-foreground mt-4">Sem dados para exibir o gráfico</p>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Proventos</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['agenda', 'extrato', 'historico', 'ativos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'agenda' ? 'Agenda' : 
                 tab === 'extrato' ? 'Extrato' : 
                 tab === 'historico' ? 'Histórico' : 'Ativos'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                {/* Year Selector & Month Grid */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  {/* Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setSelectedYear(y => y - 1)}
                      className="p-2"
                    >
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <span className="text-lg font-semibold text-foreground">{selectedYear}</span>
                    <button 
                      onClick={() => setSelectedYear(y => y + 1)}
                      className="p-2"
                    >
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Months Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {monthlyProventos.map((item) => (
                      <button
                        key={item.month}
                        onClick={() => setSelectedMonth(item.index)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          selectedMonth === item.index
                            ? 'border-primary bg-background'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <span className="block text-sm font-medium text-foreground">{item.month}</span>
                        <span className="block mt-1 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                          {item.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Month Details */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-medium text-foreground mb-3">
                    {MONTH_NAMES[selectedMonth]} {selectedYear}
                  </h3>
                  <p className="text-center text-muted-foreground py-4">
                    Sem proventos no mês
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'extrato' && <EmptyState />}

            {activeTab === 'historico' && <EmptyState />}

            {activeTab === 'ativos' && (
              <div className="space-y-4">
                {/* Chart Card */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-center font-medium text-foreground mb-4">Proventos Por Ativos</h3>
                  
                  {/* Period Filters */}
                  <div className="flex gap-2 mb-2 justify-center">
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

                  {/* Chart or Empty State */}
                  {hasProventos ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={proventosData}>
                          <defs>
                            <linearGradient id="colorProventos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <YAxis hide />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Proventos']}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            fill="url(#colorProventos)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <ChartEmptyState />
                  )}
                </div>

                {/* Assets List */}
                <div className="space-y-2">
                  <h3 className="text-center font-semibold text-foreground">
                    Ativos: {getPeriodLabel()}
                  </h3>
                  <p className="text-center text-muted-foreground py-4">
                    Sem proventos no período
                  </p>
                </div>
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
