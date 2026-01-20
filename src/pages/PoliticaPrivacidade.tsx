import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const sections = [
    {
      icon: Database,
      title: "1. Coleta de Dados",
      content: `Coletamos informações que você nos fornece diretamente, como nome, e-mail, dados financeiros e informações de investimentos. Também coletamos dados automaticamente através do uso da plataforma.`
    },
    {
      icon: Eye,
      title: "2. Uso das Informações",
      content: `Utilizamos seus dados para fornecer e melhorar nossos serviços, personalizar sua experiência, enviar comunicações relevantes e garantir a segurança da plataforma.`
    },
    {
      icon: Shield,
      title: "3. Proteção de Dados",
      content: `Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações. Utilizamos criptografia de ponta a ponta e práticas de segurança em conformidade com os mais altos padrões.`
    },
    {
      icon: Users,
      title: "4. Compartilhamento",
      content: `Não vendemos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Dados são compartilhados apenas com prestadores de serviços sob acordos de confidencialidade.`
    },
    {
      icon: Lock,
      title: "5. Seus Direitos",
      content: `Você tem direito a acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento. Também pode revogar seu consentimento para o processamento de dados.`
    },
    {
      icon: Mail,
      title: "6. Contato",
      content: `Para exercer seus direitos ou esclarecer dúvidas, entre em contato através do e-mail privacidade@kadig.com.br ou pelo suporte dentro da plataforma.`
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
        <h1 className="text-xl font-semibold text-foreground">Política de Privacidade</h1>
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
            A Kadig está comprometida com a proteção da privacidade e segurança dos dados de seus usuários. 
            Esta Política descreve como coletamos, usamos e protegemos suas informações pessoais.
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

        {/* LGPD Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/5 rounded-2xl p-4 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Conformidade LGPD</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estamos em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), 
            garantindo transparência e respeito aos seus direitos.
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

export default PoliticaPrivacidade;
