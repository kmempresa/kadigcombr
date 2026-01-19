import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Download,
  ArrowUp,
  ArrowDown,
  Share2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useTheme } from "@/hooks/useTheme";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { RecommendedPortfolio } from "./CarteirasRecomendadasDrawer";

interface CarteiraDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: RecommendedPortfolio | null;
}

const COLORS = [
  "#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe", 
  "#6366f1", "#818cf8", "#a5b4fc", 
  "#22d3ee", "#67e8f9", "#a5f3fc"
];

const CarteiraDetailDrawer = ({ open, onOpenChange, portfolio }: CarteiraDetailDrawerProps) => {
  const { theme, toggleTheme } = useTheme();

  if (!portfolio) return null;

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2).replace(".", ",");
    return value >= 0 ? `${formatted}%` : `-${formatted}%`;
  };

  // Group assets by sector for sector distribution
  const sectorData = portfolio.assets.reduce((acc, asset) => {
    const existing = acc.find(item => item.name === asset.sector);
    if (existing) {
      existing.value += asset.weight;
    } else {
      acc.push({ name: asset.sector, value: asset.weight });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Asset distribution data
  const assetData = portfolio.assets.map(asset => ({
    name: asset.ticker,
    value: asset.weight,
  }));

  const newAssets = portfolio.assets.filter(a => a.isNew);
  const removedAssets = portfolio.assets.filter(a => a.isRemoved);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-[#1a1f2e]">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-white">
            <button onClick={() => onOpenChange(false)}>
              <span className="font-medium">Mercado</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-gray-400">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => onOpenChange(false)} className="p-2 text-gray-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900 p-6 overflow-hidden">
            {/* Decorative lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
              <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
            </div>

            <button 
              onClick={() => onOpenChange(false)}
              className="text-gray-300 text-sm mb-6 underline"
            >
              Voltar
            </button>

            <h1 className="text-2xl font-bold text-white mb-2">
              Essa é a carteira recomendada de
            </h1>
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">
              {portfolio.name}
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Criada em: {portfolio.createdAt} • Válida até: {portfolio.validUntil}
            </p>
            <p className="text-gray-300 text-sm mb-6">
              {portfolio.description}
            </p>

            {/* Analysts */}
            <div className="flex flex-wrap gap-4 mb-6">
              {portfolio.analysts.map((analyst, index) => (
                <div key={index} className="flex items-center gap-2">
                  <img
                    src={analyst.avatarUrl}
                    alt={analyst.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-white text-sm">{analyst.name}</span>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <button className="bg-[#3a4259] hover:bg-[#4a5269] text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
              <Download className="w-5 h-5" />
              <span>Baixar Carteira</span>
            </button>
          </div>

          {/* Rentabilidade teórica */}
          <section className="p-4">
            <div className="bg-[#252b3d] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="text-white font-semibold">Rentabilidade teórica</h3>
              </div>
              <div className="h-px bg-gray-700 mb-4" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-violet-500 rounded-full" />
                    <span className="text-gray-400 text-sm">Rentabilidade Anterior</span>
                  </div>
                  <span className={`font-medium ${portfolio.rentabilidadeAnterior >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(portfolio.rentabilidadeAnterior)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-cyan-400 rounded-full" />
                    <span className="text-gray-400 text-sm">Rentabilidade Acumulada</span>
                  </div>
                  <span className={`font-medium ${portfolio.rentabilidadeAcumulada >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(portfolio.rentabilidadeAcumulada)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Benchmark */}
          <section className="px-4 pb-4">
            <div className="bg-[#252b3d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-white font-semibold">Benchmark</h3>
                </div>
                <span className="text-gray-400">{portfolio.benchmark}</span>
              </div>
              <div className="h-px bg-gray-700 mb-4" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-violet-500 rounded-full" />
                    <span className="text-gray-400 text-sm">Rentabilidade Anterior</span>
                  </div>
                  <span className={`font-medium ${portfolio.benchmarkRentAnterior >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(portfolio.benchmarkRentAnterior)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-cyan-400 rounded-full" />
                    <span className="text-gray-400 text-sm">Rentabilidade Acumulada</span>
                  </div>
                  <span className={`font-medium ${portfolio.benchmarkRentAcumulada >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(portfolio.benchmarkRentAcumulada)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Distribuição por ativo */}
          {assetData.length > 0 && (
            <section className="px-4 pb-4">
              <div className="bg-[#252b3d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-white font-semibold">Distribuição por ativo</h3>
                </div>

                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        stroke="#1a1f2e"
                        strokeWidth={2}
                      >
                        {assetData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {assetData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-1 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-400 text-xs">
                        {item.value}% - {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Distribuição por setor */}
          {sectorData.length > 0 && (
            <section className="px-4 pb-4">
              <div className="bg-[#252b3d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-white font-semibold">Distribuição por setor</h3>
                </div>

                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        stroke="#1a1f2e"
                        strokeWidth={2}
                      >
                        {sectorData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {sectorData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-1 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-400 text-sm truncate">
                        {item.value}% - {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Composição da carteira */}
          {portfolio.assets.length > 0 && (
            <section className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="text-white font-semibold">Composição da carteira</h3>
              </div>

              <div className="space-y-3">
                {portfolio.assets.filter(a => !a.isRemoved).map((asset, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#252b3d] rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {asset.logoUrl ? (
                          <img 
                            src={asset.logoUrl} 
                            alt={asset.ticker}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium text-sm truncate pr-2">{asset.name}</p>
                          {asset.isNew && (
                            <ArrowDown className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">
                            {asset.ticker}
                          </span>
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                            {asset.sector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peso:</span>
                        <span className="text-white font-medium">{asset.weight.toFixed(2).replace(".", ",")}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/L (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">EV/EBTIDA (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/VP (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Ativos que saíram da carteira */}
          {portfolio.assets.some(a => a.isRemoved) && (
            <section className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <h3 className="text-white font-semibold">Ativos que saíram da carteira</h3>
              </div>

              <div className="space-y-3">
                {portfolio.assets.filter(a => a.isRemoved).map((asset, index) => (
                  <div key={index} className="bg-[#252b3d] rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium text-sm truncate pr-2">{asset.name}</p>
                          <ArrowUp className="w-5 h-5 text-red-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">
                            {asset.ticker}
                          </span>
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                            {asset.sector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peso:</span>
                        <span className="text-white font-medium">{asset.weight.toFixed(2).replace(".", ",")}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/L (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">EV/EBTIDA (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/VP (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ativos que entraram na carteira */}
          {portfolio.assets.some(a => a.isNew) && (
            <section className="px-4 pb-20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-green-500 rounded-full" />
                <h3 className="text-white font-semibold">Ativos que entraram na carteira</h3>
              </div>

              <div className="space-y-3">
                {portfolio.assets.filter(a => a.isNew).map((asset, index) => (
                  <div key={index} className="bg-[#252b3d] rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {asset.logoUrl ? (
                          <img 
                            src={asset.logoUrl} 
                            alt={asset.ticker}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium text-sm truncate pr-2">{asset.name}</p>
                          <ArrowDown className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">
                            {asset.ticker}
                          </span>
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                            {asset.sector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peso:</span>
                        <span className="text-white font-medium">{asset.weight.toFixed(2).replace(".", ",")}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/L (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">EV/EBTIDA (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P/VP (12M)</span>
                        <span className="text-gray-400">-</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CarteiraDetailDrawer;
