import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, ChevronDown, Search, List, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { AnalysisHelpDialog, HelpButton } from "./AnalysisHelpDialog";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface HistoryRecord {
  snapshot_date: string;
  total_value: number;
  total_gain: number;
}

interface GanhoCapitalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  totalInvested: number;
  formatCurrency: (value: number) => string;
}

// Normalize asset types from database to display labels
const normalizeAssetType = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  const typeMap: { [key: string]: string } = {
    'ação': 'Ações',
    'ações': 'Ações',
    'acoes': 'Ações',
    'ações, stocks e etf': 'Ações',
    'bdrs': 'BDRs',
    'conta corrente': 'Conta Corrente',
    'conta_corrente': 'Conta Corrente',
    'criptoativos': 'Criptoativos',
    'debêntures': 'Debêntures',
    'debentures': 'Debêntures',
    'fundos': 'Fundos',
    'fiis': 'FIIs',
    'fiis e reits': 'FIIs',
    'moedas': 'Moedas',
    'personalizados': 'Personalizados',
    'poupança': 'Poupança',
    'poupanca': 'Poupança',
    'previdência': 'Previdência',
    'previdencia': 'Previdência',
    'renda fixa pré': 'Renda Fixa Pré',
    'renda_fixa_pre': 'Renda Fixa Pré',
    'renda fixa pós': 'Renda Fixa Pós',
    'renda_fixa_pos': 'Renda Fixa Pós',
    'tesouro direto': 'Tesouro Direto',
    'tesouro': 'Tesouro Direto',
  };
  return typeMap[normalized] || type;
};

export default function GanhoCapitalDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  totalInvested,
  formatCurrency
}: GanhoCapitalDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [activeTab, setActiveTab] = useState<'carteira' | 'ativo'>('carteira');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const totalGain = totalPatrimonio - totalInvested;

  // Fetch real historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const { data: history, error } = await supabase
          .from("portfolio_history")
          .select("snapshot_date, total_value, total_gain")
          .eq("user_id", session.user.id)
          .gte("snapshot_date", oneYearAgo.toISOString().split('T')[0])
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
  }, [open]);

  // Calculate gains per period from real data
  const calculatePeriodGains = () => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (historyData.length === 0) {
      // Fallback: estimate from current data
      const monthlyGain = totalGain / 12;
      return {
        monthlyGain,
        threeMonthGain: monthlyGain * 3,
        yearlyGain: totalGain,
      };
    }

    // Find closest records to each date
    const findClosestRecord = (targetDate: Date) => {
      let closest = historyData[0];
      let minDiff = Math.abs(new Date(historyData[0].snapshot_date).getTime() - targetDate.getTime());
      
      historyData.forEach(record => {
        const diff = Math.abs(new Date(record.snapshot_date).getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = record;
        }
      });
      
      return closest;
    };

    const currentRecord = historyData[historyData.length - 1];
    const oneMonthRecord = findClosestRecord(oneMonthAgo);
    const threeMonthRecord = findClosestRecord(threeMonthsAgo);
    const yearRecord = historyData[0];

    return {
      monthlyGain: currentRecord.total_gain - oneMonthRecord.total_gain,
      threeMonthGain: currentRecord.total_gain - threeMonthRecord.total_gain,
      yearlyGain: currentRecord.total_gain - yearRecord.total_gain,
    };
  };

  const { monthlyGain, threeMonthGain, yearlyGain } = calculatePeriodGains();

  const barChartData = [
    { name: 'Mês atual', value: monthlyGain, color: 'hsl(200, 70%, 70%)' },
    { name: '3 meses', value: threeMonthGain, color: 'hsl(200, 70%, 55%)' },
    { name: '12 meses', value: yearlyGain, color: 'hsl(200, 70%, 40%)' },
  ];

  // Generate monthly history from real data
  const generateMonthlyHistory = () => {
    if (historyData.length === 0) return [];

    // Group by month
    const monthlyMap = new Map<string, { gain: number; date: Date }>();
    
    historyData.forEach(record => {
      const date = new Date(record.snapshot_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = monthlyMap.get(key);
      
      if (!existing || date > existing.date) {
        monthlyMap.set(key, { gain: record.total_gain, date });
      }
    });

    // Calculate monthly differences
    const sortedMonths = Array.from(monthlyMap.entries())
      .sort((a, b) => b[1].date.getTime() - a[1].date.getTime());

    return sortedMonths.map(([key, data], index) => {
      const prevMonth = sortedMonths[index + 1];
      const monthGain = prevMonth ? data.gain - prevMonth[1].gain : data.gain;
      
      const monthName = data.date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        ganhoCapital: monthGain,
        rendimentos: monthGain,
        proventos: 0,
      };
    });
  };

  // Group investments by type
  const investmentsByType = investments.reduce((acc, inv) => {
    const type = inv.asset_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(inv);
    return acc;
  }, {} as { [key: string]: Investment[] });

  const monthlyHistory = generateMonthlyHistory();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ganho de Capital</h2>
            </div>
            <HelpButton onClick={() => setHelpOpen(true)} />
          </div>

          <AnalysisHelpDialog open={helpOpen} onOpenChange={setHelpOpen} section="ganho-capital" />

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['carteira', 'ativo'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'carteira' ? 'Carteira' : 'Por Ativo'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeTab === 'carteira' ? (
              <>
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-primary" />
                    <div>
                      <span className="text-sm text-muted-foreground">Ganho de capital: </span>
                      <span className="font-bold text-foreground">{formatCurrency(totalGain)}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Últimos 12 meses</p>

                {/* Bar Chart */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Ganho']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Bar labels */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {barChartData.map((item, index) => (
                      <div key={index} className="text-center">
                        <p className="text-xs text-muted-foreground">{item.name}</p>
                        <p className="font-bold text-foreground text-sm">{formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly History */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-1 h-6 rounded-full bg-primary" />
                  <h3 className="font-semibold text-foreground">Histórico Mensal</h3>
                </div>

                {monthlyHistory.length > 0 ? (
                  monthlyHistory.map((month, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-6 rounded-full bg-primary" />
                        <span className="font-medium text-foreground">{month.month}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative h-3 bg-muted rounded-full mb-4">
                        <div 
                          className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"
                          style={{ transform: 'translateX(-50%)' }}
                        >
                          <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">0</span>
                        </div>
                        {month.ganhoCapital > 0 && (
                          <div 
                            className="absolute left-1/2 h-full bg-primary rounded-r-full"
                            style={{ width: `${Math.min(50, Math.abs(month.ganhoCapital / totalGain) * 100)}%` }}
                          />
                        )}
                        {month.ganhoCapital < 0 && (
                          <div 
                            className="absolute right-1/2 h-full bg-red-500 rounded-l-full"
                            style={{ width: `${Math.min(50, Math.abs(month.ganhoCapital / totalGain) * 100)}%` }}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">Ganho de Capital:</span>
                          </div>
                          <span className={`font-semibold ${month.ganhoCapital >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                            {formatCurrency(month.ganhoCapital)}
                          </span>
                        </div>
                        <div className="flex justify-between pl-3">
                          <span className="text-sm text-muted-foreground">(+) Rendimentos:</span>
                          <span className="font-medium text-foreground">{formatCurrency(month.rendimentos)}</span>
                        </div>
                        <div className="flex justify-between pl-3">
                          <span className="text-sm text-muted-foreground">(+) Proventos:</span>
                          <span className="font-medium text-foreground">{formatCurrency(month.proventos)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                      Histórico ainda não disponível.<br />
                      Os dados serão registrados automaticamente.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Search and List buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">Resultado por ativo</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <List className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Grouped by type */}
                {Object.entries(investmentsByType).map(([type, assets]) => {
                  const typeLabel = normalizeAssetType(type);
                  const isExpanded = expandedSections.includes(type);
                  
                  return (
                    <div key={type}>
                      <button 
                        onClick={() => toggleSection(type)}
                        className="w-full flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-primary" />
                          <span className="font-semibold text-foreground">{typeLabel} ({assets.length})</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && assets.map((asset) => {
                        const assetGain = asset.current_value - asset.total_invested;
                        
                        return (
                          <div key={asset.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
                            <h4 className="font-medium text-foreground mb-3">{asset.asset_name}</h4>
                            
                            {/* Progress bar */}
                            <div className="relative h-3 bg-muted rounded-full mb-4">
                              <div 
                                className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"
                                style={{ transform: 'translateX(-50%)' }}
                              >
                                <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">0</span>
                              </div>
                              {assetGain > 0 && totalGain > 0 && (
                                <div 
                                  className="absolute left-1/2 h-full bg-primary rounded-r-full"
                                  style={{ width: `${Math.min(50, (assetGain / totalGain) * 100)}%` }}
                                />
                              )}
                              {assetGain < 0 && (
                                <div 
                                  className="absolute right-1/2 h-full bg-red-500 rounded-l-full"
                                  style={{ width: `${Math.min(50, Math.abs(assetGain / (totalGain || 1)) * 100)}%` }}
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 rounded-full bg-primary" />
                                  <span className="text-sm text-muted-foreground">Ganho de Capital:</span>
                                </div>
                                <span className={`font-semibold ${assetGain >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                  {formatCurrency(assetGain)}
                                </span>
                              </div>
                              <div className="flex justify-between pl-3">
                                <span className="text-sm text-muted-foreground">(+) Rendimentos:</span>
                                <span className="font-medium text-foreground">{formatCurrency(assetGain)}</span>
                              </div>
                              <div className="flex justify-between pl-3">
                                <span className="text-sm text-muted-foreground">(+) Proventos:</span>
                                <span className="font-medium text-foreground">{formatCurrency(0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
