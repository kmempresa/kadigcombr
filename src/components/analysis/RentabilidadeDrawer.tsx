import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

interface HistoryRecord {
  snapshot_date: string;
  total_value: number;
  total_invested: number;
  total_gain: number;
  gain_percent: number;
  cdi_accumulated: number | null;
  ipca_accumulated: number | null;
}

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
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [activeTab, setActiveTab] = useState<'geral' | 'mensal' | 'anual'>('geral');
  const [selectedPeriod, setSelectedPeriod] = useState('12 MESES');
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 14.96;
  const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.44;
  const cdiPercent = cdi12m > 0 ? (returnPercent / cdi12m) * 100 : 0;

  // Fetch real historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const { data: history, error } = await supabase
          .from("portfolio_history")
          .select("snapshot_date, total_value, total_invested, total_gain, gain_percent, cdi_accumulated, ipca_accumulated")
          .eq("user_id", session.user.id)
          .gte("snapshot_date", startDate.toISOString().split('T')[0])
          .order("snapshot_date", { ascending: true });

        if (error) throw error;
        setHistoryData(history || []);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [open, selectedPeriod]);

  // Generate chart data for line chart from real data
  const generateChartData = () => {
    const months = selectedPeriod === '3 MESES' ? 3 : selectedPeriod === '6 MESES' ? 6 : 12;
    
    if (historyData.length > 0) {
      // Use real historical data
      let cumulativeReturn = 0;
      let cumulativeCdi = 0;
      let cumulativeIpca = 0;
      
      return historyData.map((record, index) => {
        const date = new Date(record.snapshot_date);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        
        // Calculate cumulative values
        const dailyReturn = record.total_invested > 0 
          ? (record.total_gain / record.total_invested) * 100 
          : 0;
        
        return {
          month: monthLabel,
          carteira: dailyReturn,
          cdi: record.cdi_accumulated || (cdi12m * (index + 1) / historyData.length),
          ipca: record.ipca_accumulated || (ipca12m * (index + 1) / historyData.length),
        };
      });
    }
    
    // Fallback: generate estimated progression
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

  // Generate monthly data from real history
  const generateMonthlyData = () => {
    if (historyData.length === 0) return [];

    // Group by month
    const monthlyMap = new Map<string, HistoryRecord>();
    
    historyData.forEach(record => {
      const date = new Date(record.snapshot_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = monthlyMap.get(key);
      
      if (!existing || new Date(record.snapshot_date) > new Date(existing.snapshot_date)) {
        monthlyMap.set(key, record);
      }
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())
      .map(record => {
        const date = new Date(record.snapshot_date);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const monthReturn = record.total_invested > 0 ? (record.total_gain / record.total_invested) * 100 : 0;
        const monthCdi = record.cdi_accumulated || (cdi12m / 12);
        
        return {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          saldoBruto: record.total_value,
          rentabilidade: monthReturn,
          sobreCdi: monthCdi > 0 ? (monthReturn / monthCdi) * 100 : 0,
          cdi: monthCdi,
          ipca: record.ipca_accumulated || (ipca12m / 12),
        };
      });
  };

  // Generate annual data
  const generateAnnualData = () => {
    if (historyData.length === 0) {
      const currentYear = new Date().getFullYear();
      return [{
        year: currentYear,
        rentNoAno: returnPercent,
        rentAcumulada: returnPercent,
      }];
    }

    // Group by year
    const yearlyMap = new Map<number, HistoryRecord>();
    
    historyData.forEach(record => {
      const date = new Date(record.snapshot_date);
      const year = date.getFullYear();
      const existing = yearlyMap.get(year);
      
      if (!existing || new Date(record.snapshot_date) > new Date(existing.snapshot_date)) {
        yearlyMap.set(year, record);
      }
    });

    return Array.from(yearlyMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, record]) => {
        const yearReturn = record.total_invested > 0 ? (record.total_gain / record.total_invested) * 100 : 0;
        
        return {
          year,
          rentNoAno: yearReturn,
          rentAcumulada: yearReturn,
        };
      });
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

  // Get current month data from indicators
  const currentMonthCdi = economicIndicators?.current?.cdi || (cdi12m / 12);
  const currentMonthReturn = returnPercent / 12; // Estimate monthly return

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeTab === 'geral' ? (
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
                      <span className="font-semibold text-foreground">{currentMonthReturn.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CDI:</span>
                      <span className="font-medium text-foreground">{currentMonthCdi.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'mensal' ? (
              <>
                {monthlyData.length > 0 ? (
                  monthlyData.map((month, index) => (
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
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                      Histórico mensal ainda não disponível.<br />
                      Os dados serão registrados automaticamente.
                    </p>
                  </div>
                )}
              </>
            ) : (
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
