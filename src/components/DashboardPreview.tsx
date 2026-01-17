import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { Wallet, Building2, TrendingUp, Coins } from "lucide-react";

const chartData = [
  { month: "Jan", value: 1800000 },
  { month: "Fev", value: 1950000 },
  { month: "Mar", value: 1920000 },
  { month: "Abr", value: 2100000 },
  { month: "Mai", value: 2250000 },
  { month: "Jun", value: 2400000 },
  { month: "Jul", value: 2550000 },
  { month: "Ago", value: 2680000 },
  { month: "Set", value: 2750000 },
  { month: "Out", value: 2847650 },
];

const pieData = [
  { name: "Ações", value: 35, color: "hsl(220, 50%, 15%)" },
  { name: "Renda Fixa", value: 28, color: "hsl(220, 40%, 35%)" },
  { name: "Imóveis", value: 22, color: "hsl(160, 60%, 45%)" },
  { name: "Fundos", value: 15, color: "hsl(220, 25%, 55%)" },
];

export const DashboardPreview = () => {
  const [liveValue, setLiveValue] = useState(2847650);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveValue((prev) => {
        const change = (Math.random() - 0.48) * 500;
        return Math.round(prev + change);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-background relative" id="soluções">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Visão completa do seu patrimônio
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dashboard intuitivo com métricas em tempo real e análises avançadas
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden"
        >
          {/* Dashboard Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Patrimônio Total
              </p>
              <motion.p
                key={liveValue}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-bold text-foreground"
              >
                R$ {liveValue.toLocaleString("pt-BR")}
              </motion.p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-kadig-success-light text-kadig-success text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kadig-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kadig-success"></span>
              </span>
              Ao vivo
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {/* Chart Section */}
            <div className="md:col-span-2 p-6 border-r border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Evolução Patrimonial
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(220, 50%, 15%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(220, 50%, 15%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(220, 10%, 45%)", fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(220, 50%, 15%)"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation Section */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Alocação</p>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-border">
            <QuickStat
              icon={<Wallet className="w-4 h-4" />}
              label="Liquidez"
              value="R$ 450K"
            />
            <QuickStat
              icon={<Building2 className="w-4 h-4" />}
              label="Imóveis"
              value="R$ 620K"
            />
            <QuickStat
              icon={<TrendingUp className="w-4 h-4" />}
              label="Investimentos"
              value="R$ 1.5M"
            />
            <QuickStat
              icon={<Coins className="w-4 h-4" />}
              label="Outros"
              value="R$ 277K"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const QuickStat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <motion.div
    whileHover={{ backgroundColor: "hsl(var(--secondary))" }}
    className="p-4 border-r last:border-r-0 border-border transition-colors"
  >
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-lg font-semibold text-foreground">{value}</p>
  </motion.div>
);
