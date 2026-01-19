import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Building2, 
  Landmark, 
  Coins, 
  PiggyBank,
  Wallet,
  Globe,
  Shield,
  BadgeDollarSign,
  BarChart3,
  CircleDollarSign,
  Banknote,
  Home,
  Car,
  DollarSign,
  Building,
  Plane
} from "lucide-react";

const assetTypes = [
  {
    icon: TrendingUp,
    name: "Ações",
    description: "B3, NYSE, NASDAQ",
    color: "from-blue-500 to-cyan-500",
    examples: "PETR4, VALE3"
  },
  {
    icon: Building2,
    name: "FIIs",
    description: "Fundos Imobiliários",
    color: "from-purple-500 to-pink-500",
    examples: "HGLG11, MXRF11"
  },
  {
    icon: Globe,
    name: "BDRs",
    description: "Depositary Receipts",
    color: "from-orange-500 to-red-500",
    examples: "AAPL34, GOOGL34"
  },
  {
    icon: Landmark,
    name: "Tesouro",
    description: "Títulos Públicos",
    color: "from-green-500 to-emerald-500",
    examples: "Selic, IPCA+"
  },
  {
    icon: BadgeDollarSign,
    name: "CDBs",
    description: "Certificados",
    color: "from-amber-500 to-yellow-500",
    examples: "100% CDI"
  },
  {
    icon: Shield,
    name: "LCI/LCA",
    description: "Crédito Imob./Agro",
    color: "from-teal-500 to-cyan-500",
    examples: "Isentas de IR"
  },
  {
    icon: Coins,
    name: "Criptos",
    description: "Bitcoin, Ethereum",
    color: "from-violet-500 to-purple-500",
    examples: "BTC, ETH, SOL"
  },
  {
    icon: BarChart3,
    name: "Fundos",
    description: "Multimercado, RF",
    color: "from-rose-500 to-pink-500",
    examples: "XP, BTG"
  },
  {
    icon: PiggyBank,
    name: "Previdência",
    description: "PGBL e VGBL",
    color: "from-indigo-500 to-blue-500",
    examples: "Aposentadoria"
  },
  {
    icon: Wallet,
    name: "Conta",
    description: "Saldo em conta",
    color: "from-slate-500 to-gray-500",
    examples: "Nubank, Inter"
  },
  {
    icon: CircleDollarSign,
    name: "Poupança",
    description: "Caderneta",
    color: "from-sky-500 to-blue-500",
    examples: "Tradicional"
  },
  {
    icon: Banknote,
    name: "Debêntures",
    description: "Títulos de dívida",
    color: "from-fuchsia-500 to-pink-500",
    examples: "Incentivadas"
  },
];

const globalAssets = [
  {
    icon: Home,
    name: "Imóveis",
    color: "from-amber-600 to-orange-500"
  },
  {
    icon: Car,
    name: "Veículos",
    color: "from-slate-600 to-gray-500"
  },
  {
    icon: DollarSign,
    name: "USD, EUR",
    color: "from-green-600 to-emerald-500"
  },
  {
    icon: Building,
    name: "Bancos Int.",
    color: "from-blue-600 to-indigo-500"
  },
  {
    icon: Plane,
    name: "Exterior",
    color: "from-violet-600 to-purple-500"
  },
];

export const AssetTypesSection = () => {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Todos os tipos de{" "}
            <span className="text-primary">investimentos</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Do básico ao avançado, cadastre qualquer tipo de ativo e acompanhe 
            tudo em um só lugar.
          </p>
        </motion.div>

        {/* Asset Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 mb-8 sm:mb-12">
          {assetTypes.map((asset, index) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ y: -4 }}
              className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 group cursor-pointer hover:border-primary/30 transition-all text-center"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center mb-2 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform mx-auto`}>
                <asset.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              
              <h3 className="font-bold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{asset.name}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{asset.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Global Patrimony Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-2xl font-bold text-foreground">Patrimônio Global</h3>
                <p className="text-xs sm:text-base text-muted-foreground truncate">Consolide todo seu patrimônio</p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
              {globalAssets.map((asset, index) => (
                <motion.div
                  key={asset.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-background/50 rounded-lg sm:rounded-xl p-2 sm:p-3"
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${asset.color} flex items-center justify-center shrink-0`}>
                    <asset.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-medium text-foreground text-center sm:text-left">{asset.name}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full" />
                <span className="text-emerald-400 text-[10px] sm:text-sm font-medium">Conversão automática</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full" />
                <span className="text-blue-400 text-[10px] sm:text-sm font-medium">USD, EUR, GBP</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-purple-400 rounded-full" />
                <span className="text-purple-400 text-[10px] sm:text-sm font-medium">Avenue, IBKR</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
