import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Building2, LineChart, Coins } from "lucide-react";

const generateData = () =>
  Array.from({ length: 20 }, (_, i) => ({
    value: 1800000 + Math.random() * 500000 + i * 30000,
  }));

const allocation = [
  { name: "Ações", value: 35, color: "hsl(210, 100%, 60%)" },
  { name: "Renda Fixa", value: 28, color: "hsl(185, 80%, 55%)" },
  { name: "Imóveis", value: 22, color: "hsl(210, 100%, 75%)" },
  { name: "Fundos", value: 15, color: "hsl(220, 40%, 40%)" },
];

export const DashboardPreview = () => {
  const [data, setData] = useState(generateData);
  const [activeAsset, setActiveAsset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => [
        ...prev.slice(1),
        { value: prev[prev.length - 1].value + (Math.random() - 0.45) * 20000 },
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const assets = [
    { icon: <Wallet />, name: "Liquidez", value: "R$ 450K", change: "+2.3%", up: true },
    { icon: <Building2 />, name: "Imóveis", value: "R$ 1.2M", change: "+8.1%", up: true },
    { icon: <LineChart />, name: "Ações", value: "R$ 890K", change: "-1.2%", up: false },
    { icon: <Coins />, name: "Cripto", value: "R$ 120K", change: "+15.4%", up: true },
  ];

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Visão <span className="text-primary">360°</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cada ativo, cada variação, em tempo real
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 glass-strong rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Evolução Patrimonial</p>
                <p className="text-2xl font-bold text-foreground">R$ 2.84M</p>
              </div>
              <div className="flex items-center gap-2 text-kadig-cyan text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +12.4%
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(210, 100%, 60%)"
                    strokeWidth={3}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Allocation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-strong rounded-3xl p-6"
          >
            <p className="text-sm text-muted-foreground mb-4">Alocação</p>

            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {allocation.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Asset cards */}
          {assets.map((asset, i) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setActiveAsset(i)}
              className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                activeAsset === i ? "glow-blue border-primary/30" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
                  {asset.icon}
                </div>
                <span className="text-sm text-muted-foreground">{asset.name}</span>
              </div>
              <p className="text-xl font-bold text-foreground mb-1">{asset.value}</p>
              <div className={`flex items-center gap-1 text-sm ${asset.up ? "text-kadig-cyan" : "text-red-400"}`}>
                {asset.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {asset.change}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
