import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HelpCircle, BookOpen, TrendingUp, PieChart, BarChart3, Shield, Coins, LineChart, Activity, AlertTriangle } from "lucide-react";

export type AnalysisSectionType = 
  | 'distribuicao'
  | 'evolucao'
  | 'rentabilidade'
  | 'risco-retorno'
  | 'sensibilidade'
  | 'proventos'
  | 'cobertura-fgc'
  | 'ganho-capital'
  | 'rentabilidade-real'
  | 'projecao'
  | 'simulador';

interface HelpContent {
  title: string;
  icon: React.ReactNode;
  description: string;
  tips: string[];
  metrics?: { label: string; description: string }[];
}

const helpContent: Record<AnalysisSectionType, HelpContent> = {
  'distribuicao': {
    title: 'Distribuição da Carteira',
    icon: <PieChart className="w-6 h-6 text-primary" />,
    description: 'Visualize como seus investimentos estão distribuídos por classe de ativo, estratégia e instituição financeira.',
    tips: [
      'Diversificação reduz riscos - evite concentrar mais de 30% em um único ativo',
      'Compare sua distribuição com carteiras recomendadas para seu perfil',
      'Reavalie periodicamente para manter sua estratégia alinhada aos objetivos',
    ],
    metrics: [
      { label: '% Carteira', description: 'Percentual que cada ativo representa do total' },
      { label: 'Saldo Classe', description: 'Valor total investido em cada categoria' },
    ],
  },
  'evolucao': {
    title: 'Evolução da Carteira',
    icon: <LineChart className="w-6 h-6 text-primary" />,
    description: 'Acompanhe o crescimento do seu patrimônio ao longo do tempo, comparando com indicadores como CDI e IPCA.',
    tips: [
      'Observe a tendência de longo prazo, não apenas variações diárias',
      'Compare sua rentabilidade com o CDI para saber se está superando a renda fixa',
      'O gráfico acumulado mostra seu progresso desde o primeiro investimento',
    ],
    metrics: [
      { label: 'Saldo Bruto', description: 'Valor total atual de todos os investimentos' },
      { label: 'Valor Aplicado', description: 'Total que você investiu (sem ganhos)' },
      { label: 'Rent. sobre CDI', description: 'Quanto sua carteira rendeu em % do CDI' },
    ],
  },
  'rentabilidade': {
    title: 'Rentabilidade',
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    description: 'Analise os retornos da sua carteira em diferentes períodos e compare com benchmarks do mercado.',
    tips: [
      'Rentabilidade passada não garante resultados futuros',
      'Compare sempre com CDI e IPCA para entender ganhos reais',
      'Analise tanto a visão geral quanto o histórico mensal e anual',
    ],
    metrics: [
      { label: 'Rent. do Período', description: 'Retorno percentual no período selecionado' },
      { label: 'CDI', description: 'Taxa de referência do mercado de renda fixa' },
      { label: 'IPCA', description: 'Inflação oficial - seus ganhos reais são rentabilidade menos IPCA' },
    ],
  },
  'risco-retorno': {
    title: 'Risco Retorno',
    icon: <Activity className="w-6 h-6 text-primary" />,
    description: 'Entenda a relação entre risco e retorno da sua carteira através do Índice de Sharpe.',
    tips: [
      'Sharpe > 1.0 indica bom retorno ajustado ao risco',
      'Sharpe > 2.0 é considerado excelente',
      'Quanto maior a volatilidade, maior o risco de oscilações',
    ],
    metrics: [
      { label: 'Sharpe', description: 'Retorno excedente dividido pela volatilidade' },
      { label: 'Volatilidade', description: 'Medida de variação dos preços (risco)' },
      { label: 'Retorno', description: 'Ganho percentual da carteira' },
    ],
  },
  'sensibilidade': {
    title: 'Sensibilidade dos Ativos',
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    description: 'Descubra quais ativos mais contribuem (positiva ou negativamente) para o resultado da sua carteira.',
    tips: [
      'Ativos com alta contribuição positiva são os maiores geradores de retorno',
      'Ativos com contribuição negativa estão reduzindo sua rentabilidade',
      'Considere reduzir posições em ativos consistentemente negativos',
    ],
    metrics: [
      { label: 'Contribuição', description: 'Quanto cada ativo adiciona/subtrai do retorno total' },
      { label: 'Peso', description: 'Percentual do ativo no portfólio' },
      { label: 'Volatilidade', description: 'Risco individual do ativo' },
    ],
  },
  'proventos': {
    title: 'Proventos',
    icon: <Coins className="w-6 h-6 text-primary" />,
    description: 'Acompanhe dividendos, JCP e outros proventos recebidos dos seus investimentos.',
    tips: [
      'FIIs e ações pagadoras de dividendos geram renda passiva',
      'Dividend Yield indica o retorno em dividendos sobre o preço pago',
      'Reinvestir proventos acelera o crescimento do patrimônio',
    ],
    metrics: [
      { label: 'Total Recebido', description: 'Soma de todos os proventos no período' },
      { label: 'Yield', description: 'Retorno percentual em proventos' },
    ],
  },
  'cobertura-fgc': {
    title: 'Cobertura FGC',
    icon: <Shield className="w-6 h-6 text-primary" />,
    description: 'Verifique se seus investimentos em renda fixa estão protegidos pelo Fundo Garantidor de Créditos.',
    tips: [
      'O FGC cobre até R$ 250.000 por CPF por instituição',
      'CDBs, LCIs, LCAs e Poupança são cobertos pelo FGC',
      'Diversifique entre instituições para maximizar a proteção',
    ],
    metrics: [
      { label: 'Valor Coberto', description: 'Montante protegido pelo FGC' },
      { label: 'Valor Descoberto', description: 'Montante acima do limite de proteção' },
    ],
  },
  'ganho-capital': {
    title: 'Ganho de Capital',
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    description: 'Acompanhe os ganhos de capital das suas operações e entenda as implicações fiscais.',
    tips: [
      'Vendas de ações até R$ 20.000/mês são isentas de IR',
      'FIIs não têm isenção - o ganho é sempre tributado em 20%',
      'Day trade tem tributação diferente de operações normais',
    ],
    metrics: [
      { label: 'Ganho Líquido', description: 'Lucro total nas vendas de ativos' },
      { label: 'IR Estimado', description: 'Imposto de renda a pagar sobre os ganhos' },
    ],
  },
  'rentabilidade-real': {
    title: 'Rentabilidade Real',
    icon: <LineChart className="w-6 h-6 text-primary" />,
    description: 'Veja quanto sua carteira realmente rendeu descontando a inflação (IPCA).',
    tips: [
      'Rentabilidade real = rentabilidade nominal - inflação',
      'Ganhar do CDI não significa ganhar da inflação',
      'O poder de compra só aumenta com rentabilidade real positiva',
    ],
    metrics: [
      { label: 'Rent. Nominal', description: 'Retorno bruto sem descontar inflação' },
      { label: 'Rent. Real', description: 'Retorno líquido descontando IPCA' },
    ],
  },
  'projecao': {
    title: 'Projeção',
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    description: 'Simule o crescimento futuro do seu patrimônio com base em aportes e rentabilidade estimada.',
    tips: [
      'Projeções são estimativas - resultados reais podem variar',
      'Aportes regulares aceleram significativamente o crescimento',
      'Juros compostos são mais poderosos no longo prazo',
    ],
  },
  'simulador': {
    title: 'Simulador',
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    description: 'Teste diferentes cenários de investimento e veja como decisões impactam seu patrimônio.',
    tips: [
      'Compare cenários otimistas, realistas e pessimistas',
      'Simule diferentes valores de aporte mensal',
      'Avalie o impacto de diferentes prazos de investimento',
    ],
  },
};

interface AnalysisHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: AnalysisSectionType;
}

export function AnalysisHelpDialog({ open, onOpenChange, section }: AnalysisHelpDialogProps) {
  const content = helpContent[section];

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {content.icon}
            <DialogTitle className="text-lg">{content.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tips */}
          <div>
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Dicas
            </h4>
            <ul className="space-y-2">
              {content.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Metrics */}
          {content.metrics && content.metrics.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Métricas
              </h4>
              <div className="space-y-2">
                {content.metrics.map((metric, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-foreground text-sm">{metric.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reusable Help Button Component
interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className = "" }: HelpButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors ${className}`}
      aria-label="Ajuda"
    >
      <HelpCircle className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}
