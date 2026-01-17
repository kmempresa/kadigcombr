import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, HelpCircle, Info } from "lucide-react";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface RiscoRetornoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  totalInvested: number;
  economicIndicators: any;
}

// Sharpe Ratio Gauge Component
const SharpeGauge = ({ value }: { value: number }) => {
  // Normalize sharpe ratio to 0-180 degrees
  // -3 to 3 range mapped to 0 to 180
  const normalizedValue = Math.min(3, Math.max(-3, value));
  const angle = ((normalizedValue + 3) / 6) * 180;
  
  // Gradient colors from red to yellow to green
  const getGradientStyle = () => {
    return {
      background: `conic-gradient(
        from 180deg,
        hsl(0, 80%, 55%) 0deg,
        hsl(30, 80%, 55%) 60deg,
        hsl(50, 80%, 55%) 90deg,
        hsl(80, 70%, 50%) 120deg,
        hsl(120, 60%, 45%) 180deg,
        transparent 180deg
      )`,
    };
  };

  return (
    <div className="relative w-56 h-28 mx-auto">
      {/* Gauge background */}
      <div 
        className="absolute inset-0 rounded-t-full overflow-hidden"
        style={getGradientStyle()}
      />
      
      {/* Inner white circle */}
      <div className="absolute left-1/2 bottom-0 w-40 h-20 bg-card rounded-t-full transform -translate-x-1/2" />
      
      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{ 
          transform: `translateX(-50%) rotate(${angle - 90}deg)`,
          width: '2px',
          height: '70px',
        }}
      >
        <div className="w-2 h-16 bg-gray-600 rounded-full transform -translate-x-1/2" />
        <div className="w-4 h-4 bg-gray-600 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      {/* Center text */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-muted-foreground">Sharpe</p>
        <p className="text-2xl font-bold text-foreground">{value.toFixed(2)}</p>
      </div>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-4 text-sm text-muted-foreground">Risco</div>
      <div className="absolute bottom-0 right-4 text-sm text-muted-foreground">Retorno</div>
    </div>
  );
};

// Color bar for Sharpe in assets
const SharpeColorBar = ({ sharpe }: { sharpe: number }) => {
  // Normalize sharpe ratio to position on bar
  const normalizedValue = Math.min(3, Math.max(-3, sharpe));
  const position = ((normalizedValue + 3) / 6) * 100;

  return (
    <div className="relative">
      {/* Color bar */}
      <div 
        className="h-3 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(to right, hsl(0, 80%, 55%), hsl(30, 80%, 55%), hsl(50, 80%, 55%), hsl(80, 70%, 50%), hsl(120, 60%, 45%))',
        }}
      />
      {/* Position indicator */}
      <div 
        className="absolute top-full left-0 mt-1 flex flex-col items-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-600" />
        <span className="text-xs text-muted-foreground mt-1">Sharpe {sharpe.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default function RiscoRetornoDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  totalInvested,
  economicIndicators
}: RiscoRetornoDrawerProps) {
  const [activeTab, setActiveTab] = useState<'carteira' | 'ativos'>('carteira');

  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 13.14;
  
  // Simplified volatility calculation (in real app, use historical data)
  const volatility = 1.41;
  
  // Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Standard Deviation
  const riskFreeRate = cdi12m;
  const sharpeRatio = volatility > 0 ? (returnPercent - riskFreeRate) / volatility : 0;

  // Calculate per asset
  const assetData = investments.map(inv => {
    const invReturn = inv.gain_percent;
    const invVolatility = Math.abs(invReturn) * 0.1 + 0.5; // Simplified
    const invSharpe = invVolatility > 0 ? (invReturn - riskFreeRate) / invVolatility : 0;
    
    return {
      ...inv,
      returnAnnualized: invReturn,
      cdiAnnualized: cdi12m,
      volatility: invVolatility,
      sharpe: invSharpe,
    };
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background light-theme">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Risco Retorno</h2>
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
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <h3 className="font-medium text-foreground">Carteira do Início</h3>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  {/* Sharpe Gauge */}
                  <SharpeGauge value={sharpeRatio} />
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Retorno Carteira</p>
                      <p className="font-bold text-foreground">{returnPercent.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Retorno CDI</p>
                      <p className="font-bold text-foreground">{cdi12m.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Volatilidade</p>
                      <p className="font-bold text-foreground">{volatility.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                {/* Histórico */}
                <h3 className="text-center font-medium text-foreground">Histórico</h3>
                
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-6 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">2026</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{
                    background: 'linear-gradient(to right, hsl(0, 80%, 55%), hsl(30, 80%, 55%), hsl(50, 80%, 55%), hsl(80, 70%, 50%), hsl(120, 60%, 45%))',
                  }} />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-center font-medium text-foreground">Histórico</h3>
                
                {assetData.map((asset) => (
                  <div key={asset.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">{asset.asset_name}</span>
                    </div>
                    
                    {/* Color Bar */}
                    <div className="mb-8">
                      <SharpeColorBar sharpe={asset.sharpe} />
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ret. anualizado</p>
                        <p className="font-bold text-foreground">{asset.returnAnnualized.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ret. anualizado CDI</p>
                        <p className="font-bold text-foreground">{asset.cdiAnnualized.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Volatilidade</p>
                        <p className="font-bold text-foreground">{asset.volatility.toFixed(2)}%</p>
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
