import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronDown, Search, List } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
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

  const totalGain = totalPatrimonio - totalInvested;
  
  // Calculate gains per period
  const monthlyGain = totalGain / 12;
  const threeMonthGain = monthlyGain * 3;
  const yearlyGain = totalGain;

  const barChartData = [
    { name: 'Mês atual', value: monthlyGain, color: 'hsl(200, 70%, 70%)' },
    { name: '3 meses', value: threeMonthGain, color: 'hsl(200, 70%, 55%)' },
    { name: '12 meses', value: yearlyGain, color: 'hsl(200, 70%, 40%)' },
  ];

  // Generate monthly history
  const generateMonthlyHistory = () => {
    const today = new Date();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const monthGain = monthlyGain * (Math.random() * 0.5 + 0.75);
      
      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        ganhoCapital: monthGain,
        rendimentos: monthGain,
        proventos: 0,
      });
    }
    
    return months;
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
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

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
            {activeTab === 'carteira' ? (
              <>
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-primary" />
                    <div>
                      <span className="text-sm text-muted-foreground">Ganho de capital: </span>
                      <span className="font-bold text-foreground">{formatCurrency(yearlyGain)}</span>
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

                {monthlyHistory.map((month, index) => (
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
                      <div 
                        className="absolute right-0 h-full bg-primary rounded-r-full"
                        style={{ width: `${Math.min(50, (month.ganhoCapital / yearlyGain) * 100)}%` }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 rounded-full bg-primary" />
                          <span className="text-sm text-muted-foreground">Ganho de Capital:</span>
                        </div>
                        <span className="font-semibold text-foreground">{formatCurrency(month.ganhoCapital)}</span>
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
                ))}
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
                              {assetGain > 0 && (
                                <div 
                                  className="absolute left-1/2 h-full bg-primary rounded-r-full"
                                  style={{ width: `${Math.min(50, (assetGain / yearlyGain) * 100)}%` }}
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 rounded-full bg-primary" />
                                  <span className="text-sm text-muted-foreground">Ganho de Capital:</span>
                                </div>
                                <span className="font-semibold text-foreground">{formatCurrency(assetGain)}</span>
                              </div>
                              <div className="flex justify-between pl-3">
                                <span className="text-sm text-muted-foreground">(+) Rendimentos:</span>
                                <span className="font-medium text-foreground">{formatCurrency(assetGain)}</span>
                              </div>
                              <div className="flex justify-between pl-3">
                                <span className="text-sm text-muted-foreground">(+) Proventos :</span>
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
