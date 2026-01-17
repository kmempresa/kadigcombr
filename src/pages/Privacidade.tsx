import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import kadigLogo from "@/assets/kadig-logo.png";

const Privacidade = () => {
  const sections = [
    {
      icon: Database,
      title: "1. Coleta de Dados",
      content: `Coletamos informações que você nos fornece diretamente, como nome, e-mail, dados financeiros e informações de investimentos. Também coletamos dados automaticamente através do uso da plataforma, incluindo dados de navegação, dispositivo e localização aproximada.`
    },
    {
      icon: Eye,
      title: "2. Uso das Informações",
      content: `Utilizamos seus dados para fornecer e melhorar nossos serviços, personalizar sua experiência, enviar comunicações relevantes, garantir a segurança da plataforma e cumprir obrigações legais. Seus dados financeiros são utilizados exclusivamente para consolidar e analisar sua carteira de investimentos.`
    },
    {
      icon: Shield,
      title: "3. Proteção de Dados",
      content: `Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia de ponta a ponta, servidores seguros e práticas de segurança em conformidade com os mais altos padrões do mercado.`
    },
    {
      icon: Users,
      title: "4. Compartilhamento",
      content: `Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Podemos compartilhar dados com prestadores de serviços que nos auxiliam na operação da plataforma, sempre sob acordos de confidencialidade rigorosos.`
    },
    {
      icon: Lock,
      title: "5. Seus Direitos",
      content: `Você tem direito a acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento. Também pode revogar seu consentimento para o processamento de dados e solicitar a portabilidade de suas informações.`
    },
    {
      icon: Mail,
      title: "6. Contato",
      content: `Para exercer seus direitos ou esclarecer dúvidas sobre nossa política de privacidade, entre em contato conosco através do e-mail privacidade@kadig.com.br ou pelo suporte dentro da plataforma.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/site" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          <Link to="/site">
            <img src={kadigLogo} alt="Kadig" className="h-6" />
          </Link>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sua privacidade é nossa prioridade. Conheça como coletamos, usamos e protegemos suas informações.
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl p-8 mb-8"
          >
            <p className="text-muted-foreground leading-relaxed">
              A Kadig está comprometida com a proteção da privacidade e segurança dos dados de seus usuários. 
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas 
              informações pessoais quando você utiliza nossa plataforma de gestão de investimentos.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="glass rounded-2xl p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* LGPD Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 glass-strong rounded-2xl p-8 border border-primary/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Conformidade com a LGPD
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              A Kadig está em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              Garantimos que seus dados pessoais são tratados com transparência, segurança e respeito aos seus direitos 
              como titular dos dados. Para mais informações sobre a LGPD, visite o site da{" "}
              <a 
                href="https://www.gov.br/anpd/pt-br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Autoridade Nacional de Proteção de Dados (ANPD)
              </a>.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kadig. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacidade;
