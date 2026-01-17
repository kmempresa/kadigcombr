import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, Check, Search, ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface ComparadorAtivosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  formatCurrency: (value: number) => string;
  economicIndicators: any;
}

const INDICES = ['POUPANÇA', 'CDI', 'IBOVESPA', 'IPCA', 'IFIX'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

type Step = 'main' | 'indices' | 'ativo' | 'periodo-inicio' | 'periodo-fim' | 'resultado';

export default function ComparadorAtivosDrawer({
  open,
  onOpenChange,
  investments,
  formatCurrency,
  economicIndicators
}: ComparadorAtivosDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [currentStep, setCurrentStep] = useState<Step>('main');
  const [selectedIndices, setSelectedIndices] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
  const [startYear, setStartYear] = useState(2026);
  const [startMonth, setStartMonth] = useState<string | null>(null);
  const [endYear, setEndYear] = useState(2026);
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cdi12m = economicIndicators?.accumulated12m?.cdi || 13.08;
  const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.44;

  const filteredInvestments = investments.filter(inv => 
    inv.asset_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleIndex = (index: string) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : prev.length < 4 ? [...prev, index] : prev
    );
  };

  const canShowResult = selectedIndices.length > 0 && selectedAsset && startMonth && endMonth;

  const getPeriodLabel = () => {
    if (!startMonth || !endMonth) return '';
    return `De ${startMonth.toLowerCase()}.${startYear} até ${endMonth.toLowerCase()}.${endYear}`;
  };

  // Generate comparison chart data
  const generateChartData = () => {
    if (!selectedAsset) return [];
    
    const months = 12;
    const data = [];
    
    for (let i = 0; i <= months; i++) {
      const progress = i / months;
      const entry: any = {
        month: i,
        'Rent. Carteira': selectedAsset.gain_percent * progress,
        'Rent. Ativo': selectedAsset.gain_percent * progress,
      };
      
      if (selectedIndices.includes('CDI')) {
        entry['CDI'] = cdi12m * progress;
      }
      if (selectedIndices.includes('IPCA')) {
        entry['IPCA'] = ipca12m * progress;
      }
      if (selectedIndices.includes('POUPANÇA')) {
        entry['POUPANÇA'] = (cdi12m * 0.7) * progress;
      }
      if (selectedIndices.includes('IBOVESPA')) {
        entry['IBOV'] = (cdi12m * 0.8) * progress;
      }
      if (selectedIndices.includes('IFIX')) {
        entry['IFIX'] = (cdi12m * 0.9) * progress;
      }
      
      data.push(entry);
    }
    
    return data;
  };

  const resetAndClose = () => {
    setCurrentStep('main');
    setSelectedIndices([]);
    setSelectedAsset(null);
    setStartMonth(null);
    setEndMonth(null);
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'indices':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-center font-semibold text-foreground text-lg">Escolha os índices</h3>
            <p className="text-center text-sm text-muted-foreground">Selecione até quatro índices para comparação</p>
            
            {INDICES.map((index) => (
              <button
                key={index}
                onClick={() => toggleIndex(index)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedIndices.includes(index)
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border'
                }`}
              >
                <span className="font-medium text-foreground">{index}</span>
              </button>
            ))}
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCurrentStep('main')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={() => setCurrentStep('main')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        );

      case 'ativo':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-center font-semibold text-foreground text-lg">Escolha o investimento</h3>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full p-4 pr-12 rounded-2xl bg-card border border-border text-foreground"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            {filteredInvestments.map((inv) => {
              const bankName = inv.asset_name.includes('BANCO') 
                ? inv.asset_name.match(/BANCO\s+([A-Z0-9]+)/i)?.[0] || ''
                : '';
              
              return (
                <button
                  key={inv.id}
                  onClick={() => {
                    setSelectedAsset(inv);
                    setCurrentStep('main');
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    selectedAsset?.id === inv.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase mb-1">{bankName}</p>
                  <p className="font-medium text-emerald-500">{inv.asset_name}</p>
                </button>
              );
            })}
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCurrentStep('main')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={() => setCurrentStep('main')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        );

      case 'periodo-inicio':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-center font-semibold text-foreground text-lg">Escolha a data de início</h3>
            
            <div className="flex items-center justify-between py-4">
              <button onClick={() => setStartYear(y => y - 1)}>
                <ChevronLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <span className="text-xl font-bold text-foreground">{startYear}</span>
              <button onClick={() => setStartYear(y => y + 1)}>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {MONTHS.map((month) => (
                <button
                  key={month}
                  onClick={() => setStartMonth(month)}
                  className={`py-4 rounded-2xl border text-center transition-all ${
                    startMonth === month
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <span className="font-medium text-foreground">{month}</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCurrentStep('main')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={() => setCurrentStep('periodo-fim')}
                disabled={!startMonth}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
                <span>Avançar</span>
              </button>
            </div>
          </div>
        );

      case 'periodo-fim':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-center font-semibold text-foreground text-lg">Escolha a data final</h3>
            
            <div className="flex items-center justify-between py-4">
              <button onClick={() => setEndYear(y => y - 1)}>
                <ChevronLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <span className="text-xl font-bold text-foreground">{endYear}</span>
              <button onClick={() => setEndYear(y => y + 1)}>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {MONTHS.map((month) => (
                <button
                  key={month}
                  onClick={() => {
                    setEndMonth(month);
                    setCurrentStep('main');
                  }}
                  className={`py-4 rounded-2xl border text-center transition-all ${
                    endMonth === month
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <span className="font-medium text-foreground">{month}</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCurrentStep('periodo-inicio')}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={() => setCurrentStep('main')}
                disabled={!endMonth}
                className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 space-y-4">
            {/* Chart Area */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-center font-medium text-foreground mb-2">Carteira x Ativo</h3>
              
              {canShowResult ? (
                <>
                  <p className="text-center text-xs text-muted-foreground mb-4">{getPeriodLabel()}</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData()}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Rent. Carteira" stroke="hsl(180, 60%, 50%)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Rent. Ativo" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} />
                        {selectedIndices.includes('CDI') && <Line type="monotone" dataKey="CDI" stroke="hsl(280, 60%, 65%)" strokeWidth={2} dot={false} />}
                        {selectedIndices.includes('IPCA') && <Line type="monotone" dataKey="IPCA" stroke="hsl(30, 80%, 55%)" strokeWidth={2} dot={false} />}
                        {selectedIndices.includes('POUPANÇA') && <Line type="monotone" dataKey="POUPANÇA" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={false} />}
                        {selectedIndices.includes('IBOVESPA') && <Line type="monotone" dataKey="IBOV" stroke="hsl(200, 80%, 55%)" strokeWidth={2} dot={false} />}
                        {selectedIndices.includes('IFIX') && <Line type="monotone" dataKey="IFIX" stroke="hsl(140, 60%, 50%)" strokeWidth={2} dot={false} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium text-foreground">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rent. Carteira</p>
                      <p className="font-medium text-emerald-500">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rent. Ativo</p>
                      <p className="font-medium text-emerald-500">-</p>
                    </div>
                  </div>
                  
                  {/* Indices */}
                  <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                    {INDICES.map((idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-xs text-muted-foreground">{idx}</p>
                        <p className={`font-medium ${selectedIndices.includes(idx) ? 'text-foreground' : 'text-red-500'}`}>
                          {selectedIndices.includes(idx) ? '-' : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 bg-muted/50 rounded-xl flex flex-col items-center justify-center">
                  <Hand className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Para começar escolha as 3 opções abaixo.
                  </p>
                </div>
              )}
            </div>

            {/* Selection Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCurrentStep('indices')}
                className="bg-card border border-border rounded-2xl p-4 text-center"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${selectedIndices.length > 0 ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Check className={`w-5 h-5 ${selectedIndices.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm font-medium text-foreground">Escolher</p>
                <p className="text-sm text-muted-foreground">os índices</p>
              </button>
              
              <button
                onClick={() => setCurrentStep('ativo')}
                className="bg-card border border-border rounded-2xl p-4 text-center"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${selectedAsset ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Check className={`w-5 h-5 ${selectedAsset ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm font-medium text-foreground">Escolher</p>
                <p className="text-sm text-muted-foreground">o ativo</p>
              </button>
              
              <button
                onClick={() => setCurrentStep('periodo-inicio')}
                className="bg-card border border-border rounded-2xl p-4 text-center"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${startMonth && endMonth ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Check className={`w-5 h-5 ${startMonth && endMonth ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm font-medium text-foreground">Escolher</p>
                <p className="text-sm text-muted-foreground">o período</p>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Comparador de Ativos</h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>

          {/* Close Button */}
          {currentStep === 'main' && (
            <div className="p-4 border-t border-border">
              <button
                onClick={resetAndClose}
                className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
