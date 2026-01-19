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
  Banknote
} from "lucide-react";

const assetTypes = [
  {
    icon: TrendingUp,
    name: "Ações",
    description: "B3, NYSE, NASDAQ",
    color: "from-blue-500 to-cyan-500",
    examples: "PETR4, VALE3, ITUB4"
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
    description: "Brazilian Depositary Receipts",
    color: "from-orange-500 to-red-500",
    examples: "AAPL34, GOOGL34"
  },
  {
    icon: Landmark,
    name: "Tesouro Direto",
    description: "Títulos Públicos",
    color: "from-green-500 to-emerald-500",
    examples: "Selic, IPCA+, Prefixado"
  },
  {
    icon: BadgeDollarSign,
    name: "CDBs",
    description: "Certificados de Depósito",
    color: "from-amber-500 to-yellow-500",
    examples: "CDB 100% CDI, 120% CDI"
  },
  {
    icon: Shield,
    name: "LCIs/LCAs",
    description: "Crédito Imobiliário e Agro",
    color: "from-teal-500 to-cyan-500",
    examples: "Isentas de IR"
  },
  {
    icon: Coins,
    name: "Criptomoedas",
    description: "Bitcoin, Ethereum e mais",
    color: "from-violet-500 to-purple-500",
    examples: "BTC, ETH, SOL"
  },
  {
    icon: BarChart3,
    name: "Fundos",
    description: "Multimercado, Ações, RF",
    color: "from-rose-500 to-pink-500",
    examples: "XP, BTG, Itaú"
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
    name: "Conta Corrente",
    description: "Saldo em conta",
    color: "from-slate-500 to-gray-500",
    examples: "Nubank, Inter, C6"
  },
  {
    icon: CircleDollarSign,
    name: "Poupança",
    description: "Caderneta de poupança",
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

export const AssetTypesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Todos os tipos de{" "}
            <span className="text-primary">investimentos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Do básico ao avançado, cadastre qualquer tipo de ativo e acompanhe 
            tudo em um só lugar com cotações atualizadas.
          </p>
        </motion.div>

        {/* Asset Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assetTypes.map((asset, index) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-5 group cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <asset.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-bold text-foreground mb-1">{asset.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
              <p className="text-xs text-primary font-medium">{asset.examples}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <span className="text-sm text-muted-foreground">
              + Patrimônio global: imóveis, veículos, moedas estrangeiras
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
