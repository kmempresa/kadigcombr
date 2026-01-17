import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface CoberturaFGCDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  formatCurrency: (value: number) => string;
}

// FGC covers up to R$ 250,000 per institution
const FGC_LIMIT = 250000;
const FGC_TOTAL_LIMIT = 1000000;

// Check if asset type is covered by FGC
const isCoveredByFGC = (assetType: string): boolean => {
  const normalized = assetType.toLowerCase().trim();
  const coveredTypes = [
    'renda fixa pré', 'renda fixa pós', 'renda_fixa_pre', 'renda_fixa_pos',
    'poupança', 'poupanca', 'conta corrente', 'conta_corrente',
    'debêntures', 'debentures', 'cdb', 'lci', 'lca', 'lc', 'rdb'
  ];
  return coveredTypes.some(type => normalized.includes(type));
};

export default function CoberturaFGCDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  formatCurrency
}: CoberturaFGCDrawerProps) {
  const [activeTab, setActiveTab] = useState<'carteira' | 'emissor'>('carteira');

  // Filter investments covered by FGC
  const coveredInvestments = investments.filter(inv => 
    isCoveredByFGC(inv.asset_type)
  );

  // Calculate total covered value
  const totalCoveredValue = Math.min(
    coveredInvestments.reduce((sum, inv) => sum + inv.current_value, 0),
    FGC_LIMIT
  );

  // Calculate coverage percentage
  const coveragePercent = totalPatrimonio > 0 
    ? (totalCoveredValue / totalPatrimonio) * 100 
    : 0;

  // Uncovered value
  const uncoveredValue = totalPatrimonio - totalCoveredValue;

  // Group by institution (emissor)
  const byEmissor = coveredInvestments.reduce((acc, inv) => {
    let emissor = 'Outros';
    // Check for bank in name
    if (inv.asset_name.includes('BANCO')) {
      const match = inv.asset_name.match(/BANCO\s+([A-Z0-9]+)/i);
      if (match) emissor = `BANCO ${match[1].toUpperCase()}`;
    } else if (inv.asset_name.includes(' - ')) {
      // Extract institution from "Asset - INSTITUTION" format
      const parts = inv.asset_name.split(' - ');
      if (parts.length > 1) {
        emissor = parts[1].trim().toUpperCase();
      }
    }
    
    if (!acc[emissor]) {
      acc[emissor] = {
        total: 0,
        covered: 0,
      };
    }
    acc[emissor].total += inv.current_value;
    acc[emissor].covered = Math.min(acc[emissor].total, FGC_LIMIT);
    
    return acc;
  }, {} as { [key: string]: { total: number; covered: number } });

  // Remaining coverage available
  const remainingCoverage = FGC_LIMIT - totalCoveredValue;

  // Chart data for donut
  const chartData = [
    { name: 'Coberto', value: totalCoveredValue, color: 'hsl(200, 70%, 50%)' },
    { name: 'Descoberto', value: Math.max(0, uncoveredValue), color: 'hsl(0, 0%, 85%)' },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background light-theme">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Cobertura FGC</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['carteira', 'emissor'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'carteira' ? 'Carteira' : 'Por Emissor'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'carteira' ? (
              <>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-center font-medium text-foreground mb-4">Proteção Atual da Carteira</h3>
                  
                  {/* Donut Chart */}
                  <div className="h-56 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
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
                      <span className="text-sm text-muted-foreground">Coberto pelo FGC</span>
                      <span className="text-3xl font-bold text-foreground">{coveragePercent.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(200, 70%, 50%)' }} />
                      <span className="text-sm text-muted-foreground">Coberto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 0%, 85%)' }} />
                      <span className="text-sm text-muted-foreground">Descoberto</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                      <p className="font-bold text-foreground">{formatCurrency(totalPatrimonio)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Coberto</p>
                      <p className="font-bold text-foreground">{formatCurrency(totalCoveredValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Descoberto:</p>
                      <p className="font-bold text-foreground">{formatCurrency(uncoveredValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Saldo a ser Coberto</p>
                      <p className="font-bold text-foreground">{formatCurrency(remainingCoverage)}</p>
                    </div>
                  </div>
                </div>

                {/* FGC Info */}
                <div className="bg-muted/30 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O FGC garante até o limite de R$250 mil por CPF ou CNPJ, por conjunto de depósitos e 
                    investimentos em cada instituição ou conglomerado financeiro, limitado ao teto de R$1 milhão, 
                    a cada período de 4 anos, para garantias pagas para cada CPF ou CNPJ.
                  </p>
                </div>
              </>
            ) : (
              <>
                {Object.entries(byEmissor).map(([emissor, data], index) => {
                  const emissorCoverage = data.total > 0 
                    ? (data.covered / data.total) * 100 
                    : 0;

                  return (
                    <div key={emissor} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 rounded-full bg-primary" />
                          <span className="font-medium text-foreground">{emissor}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative h-3 bg-muted rounded-full mb-3 overflow-hidden">
                        <div 
                          className="absolute left-0 h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(emissorCoverage, 100)}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">Cobertura: {emissorCoverage.toFixed(2)}%</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Valor Total:</p>
                          <p className="font-bold text-foreground">{formatCurrency(data.total)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Valor Coberto</p>
                          <p className="font-bold text-foreground">{formatCurrency(data.covered)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(byEmissor).length === 0 && (
                  <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                    <p className="text-muted-foreground">
                      Nenhum investimento coberto pelo FGC encontrado
                    </p>
                  </div>
                )}
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
