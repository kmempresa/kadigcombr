import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale, Ban, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const TermosDeUso = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const sections = [
    {
      icon: CheckCircle,
      title: "1. Aceitação dos Termos",
      content: `Ao acessar e utilizar o aplicativo Kadig, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.`
    },
    {
      icon: FileText,
      title: "2. Descrição do Serviço",
      content: `O Kadig é uma plataforma de gestão e consolidação de investimentos que permite aos usuários acompanhar suas carteiras, analisar rentabilidade e tomar decisões financeiras informadas. Não somos uma corretora nem prestamos serviços de assessoria financeira.`
    },
    {
      icon: AlertTriangle,
      title: "3. Responsabilidades do Usuário",
      content: `Você é responsável por manter a confidencialidade de sua conta e senha, fornecer informações precisas e atualizadas, e utilizar o serviço em conformidade com a legislação aplicável. O uso indevido da plataforma pode resultar na suspensão ou encerramento da sua conta.`
    },
    {
      icon: Scale,
      title: "4. Limitação de Responsabilidade",
      content: `O Kadig não garante a precisão, completude ou atualidade das informações de mercado exibidas. Não nos responsabilizamos por decisões de investimento tomadas com base nas informações fornecidas pela plataforma. Investimentos envolvem riscos e você deve buscar orientação profissional.`
    },
    {
      icon: Ban,
      title: "5. Uso Proibido",
      content: `É proibido utilizar o Kadig para atividades ilegais, tentar acessar áreas não autorizadas do sistema, interferir no funcionamento da plataforma, compartilhar credenciais de acesso ou utilizar bots e scrapers não autorizados.`
    },
    {
      icon: RefreshCw,
      title: "6. Alterações nos Termos",
      content: `Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas através do aplicativo ou por e-mail. O uso continuado do serviço após alterações constitui aceitação dos novos termos.`
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${theme === "light" ? "light-theme" : ""}`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top border-b border-border">
        <button 
          onClick={() => navigate("/sobre")}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Termos de Uso</h1>
      </header>

      <div className="p-4 pb-8 space-y-4">
        {/* Last Update */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center"
        >
          Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </motion.p>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bem-vindo ao Kadig! Estes Termos de Uso regulam o acesso e utilização da nossa 
            plataforma de gestão de investimentos. Por favor, leia atentamente antes de utilizar nossos serviços.
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground mb-2">
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/5 rounded-2xl p-4 border border-primary/20"
        >
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Dúvidas sobre os Termos de Uso? Entre em contato pelo{" "}
            <span className="text-primary font-medium">suporte@kadig.com.br</span>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground/60 text-center pt-4"
        >
          © 2026 Kadig. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default TermosDeUso;
