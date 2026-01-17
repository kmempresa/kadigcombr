import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface DistribuicaoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  formatCurrency: (value: number) => string;
}

// Normalize asset types from database to display labels
const normalizeType = (type: string): string => {
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

const COLORS = [
  'hsl(280, 60%, 65%)', // Purple/pink
  'hsl(160, 60%, 45%)', // Green
  'hsl(340, 80%, 60%)', // Pink
  'hsl(200, 80%, 55%)', // Blue
  'hsl(30, 80%, 55%)',  // Orange
  'hsl(0, 70%, 60%)',   // Red
  'hsl(180, 60%, 45%)', // Teal
  'hsl(260, 60%, 55%)', // Violet
];

export default function DistribuicaoDrawer({ 
  open, 
  onOpenChange, 
  investments, 
  totalPatrimonio,
  formatCurrency 
}: DistribuicaoDrawerProps) {
  const [activeTab, setActiveTab] = useState<'classes' | 'estrategias' | 'instituicoes'>('classes');

  // Group by asset type (Classes)
  const classeData = investments.reduce((acc, inv) => {
    const label = normalizeType(inv.asset_type);
    if (!acc[label]) acc[label] = 0;
    acc[label] += inv.current_value;
    return acc;
  }, {} as { [key: string]: number });

  // Group by strategy (simplified mapping)
  const estrategiaMapping: { [key: string]: string } = {
    'Renda Fixa Pré': 'Renda Fixa Pré-fixada',
    'Renda Fixa Pós': 'Renda Fixa Pós-fixada',
    'Conta Corrente': 'Renda Fixa Pós-fixada',
    'Poupança': 'Renda Fixa Pós-fixada',
    'Tesouro Direto': 'Renda Fixa Pós-fixada',
    'Ações': 'Renda Variável',
    'FIIs': 'Renda Variável',
    'BDRs': 'Renda Variável',
    'Fundos': 'Fundos de Investimento',
    'Criptoativos': 'Criptoativos',
    'Moedas': 'Câmbio',
  };

  const estrategiaData = investments.reduce((acc, inv) => {
    const label = normalizeType(inv.asset_type);
    const estrategia = estrategiaMapping[label] || 'Outros';
    if (!acc[estrategia]) acc[estrategia] = 0;
    acc[estrategia] += inv.current_value;
    return acc;
  }, {} as { [key: string]: number });

  // Group by institution (extract from asset_name)
  const instituicaoData = investments.reduce((acc, inv) => {
    let instituicao = 'Outros';
    // Check for bank in name
    if (inv.asset_name.includes('BANCO')) {
      const match = inv.asset_name.match(/BANCO\s+([A-Z0-9]+)/i);
      if (match) instituicao = `BANCO ${match[1].toUpperCase()}`;
    } else if (inv.asset_name.includes(' - ')) {
      // Extract institution from "Asset - INSTITUTION" format
      const parts = inv.asset_name.split(' - ');
      if (parts.length > 1) {
        instituicao = parts[1].trim().toUpperCase();
      }
    } else if (inv.ticker && inv.ticker !== 'CONTA_CORRENTE') {
      // Use ticker as proxy for broker/exchange
      instituicao = 'Corretora';
    }
    if (!acc[instituicao]) acc[instituicao] = 0;
    acc[instituicao] += inv.current_value;
    return acc;
  }, {} as { [key: string]: number });

  const getCurrentData = () => {
    switch (activeTab) {
      case 'classes': return classeData;
      case 'estrategias': return estrategiaData;
      case 'instituicoes': return instituicaoData;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'classes': return 'Patrimônio por Classe de Ativo';
      case 'estrategias': return 'Patrimônio por Estratégia';
      case 'instituicoes': return 'Patrimônio por Instituição Financeira';
    }
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'classes': return 'Classes de Ativos';
      case 'estrategias': return 'Estratégias';
      case 'instituicoes': return 'Instituições';
    }
  };

  const getSaldoLabel = () => {
    switch (activeTab) {
      case 'classes': return 'Saldo Classe:';
      case 'estrategias': return 'Saldo estratégia:';
      case 'instituicoes': return 'Saldo Bruto Atual:';
    }
  };

  const currentData = getCurrentData();
  const chartData = Object.entries(currentData).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length],
    percent: totalPatrimonio > 0 ? (value / totalPatrimonio) * 100 : 0,
  }));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Distribuição da Carteira</h2>
            <button 
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['classes', 'estrategias', 'instituicoes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'classes' ? 'Classes' : tab === 'estrategias' ? 'Estratégias' : 'Instituições'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Chart Card */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-center font-medium text-foreground mb-4">{getTitle()}</h3>
              <div className="border-t border-border pt-4">
                {chartData.length > 0 ? (
                  <>
                    <div className="h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={100}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-2 h-4 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section Title */}
            <h3 className="text-center font-medium text-foreground">{getSectionTitle()}</h3>

            {/* List Items */}
            {chartData.map((item, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-6 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{getSaldoLabel()}</span>
                    <span className="font-semibold text-primary">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">% carteira:</span>
                    <span className="font-semibold text-foreground">{item.percent.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
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
