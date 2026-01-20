import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

const PerguntasFrequentes = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqCategories = [
    {
      category: "Conta e Cadastro",
      questions: [
        {
          question: "Como criar uma conta no Kadig?",
          answer: "Baixe o app e toque em 'Criar Conta'. Informe seu e-mail e crie uma senha segura. Você passará por um onboarding rápido para definir seu perfil de investidor respondendo algumas perguntas sobre seus objetivos e tolerância a risco."
        },
        {
          question: "O que é o perfil de investidor?",
          answer: "O perfil de investidor é uma classificação que define sua tolerância a risco: Conservador (prefere segurança), Moderado (equilíbrio entre risco e retorno) ou Arrojado (aceita mais risco por maiores retornos). Esse perfil ajuda a Bianca a dar recomendações personalizadas."
        },
        {
          question: "Como alterar meus dados pessoais?",
          answer: "Acesse a aba 'Sobre' no menu inferior, toque no seu perfil no topo da tela. Lá você pode editar seu nome, foto, e-mail e outras informações do seu perfil."
        },
        {
          question: "Como excluir minha conta?",
          answer: "Acesse Sobre > Segurança e Privacidade > Excluir Conta. Você precisará digitar 'EXCLUIR' para confirmar. Atenção: essa ação é irreversível e todos os seus dados serão permanentemente removidos."
        }
      ]
    },
    {
      category: "Carteiras e Investimentos",
      questions: [
        {
          question: "O que é uma carteira no Kadig?",
          answer: "Uma carteira é uma forma de organizar seus investimentos. Você pode criar carteiras diferentes para objetivos diferentes, como 'Reserva de Emergência', 'Aposentadoria' ou 'Viagem'. Cada carteira mostra o total investido, rentabilidade e distribuição dos ativos."
        },
        {
          question: "Quais tipos de investimentos posso adicionar?",
          answer: "Você pode adicionar: Ações, ETFs e Stocks (com cotação em tempo real), BDRs, FIIs e REITs, Fundos de Investimento, Criptomoedas, Renda Fixa (CDBs, LCIs, LCAs, Debêntures, Tesouro Direto), Moedas Estrangeiras, Conta Corrente e Poupança."
        },
        {
          question: "Como adicionar um investimento?",
          answer: "Acesse a aba Carteira, toque no botão + e selecione 'Adicionar Investimento'. Escolha o tipo de ativo, busque pelo ticker ou nome (para ações/fundos), informe quantidade, preço de compra e data. O sistema calculará automaticamente o valor total."
        },
        {
          question: "Como registrar uma aplicação ou resgate?",
          answer: "Selecione o ativo na sua carteira e use as opções 'Aplicar' para adicionar mais do mesmo ativo ou 'Resgatar' para registrar vendas. O histórico de movimentações fica registrado automaticamente."
        },
        {
          question: "Como transferir um ativo entre carteiras?",
          answer: "Selecione o ativo, toque em 'Transferir' e escolha a carteira de destino. O ativo será movido mantendo todo o histórico de compras e rentabilidade."
        },
        {
          question: "O que é o Patrimônio Global?",
          answer: "O Patrimônio Global inclui bens que não são investimentos financeiros tradicionais, como imóveis, veículos, joias ou outros bens de valor. Você pode cadastrá-los para ter uma visão completa do seu patrimônio total."
        }
      ]
    },
    {
      category: "Conexões e Open Finance",
      questions: [
        {
          question: "O que é o Open Finance?",
          answer: "Open Finance é um sistema regulado pelo Banco Central que permite compartilhar seus dados bancários de forma segura entre instituições. No Kadig, usamos para importar automaticamente seus investimentos de bancos e corretoras."
        },
        {
          question: "Como conectar minha conta bancária?",
          answer: "Vá até a aba Conexões e toque em 'Conectar Instituição'. Selecione seu banco ou corretora da lista, faça login com suas credenciais bancárias e autorize o compartilhamento de dados. Seus investimentos serão importados automaticamente."
        },
        {
          question: "Quais instituições posso conectar?",
          answer: "Suportamos as principais instituições do Brasil que participam do Open Finance, incluindo grandes bancos, corretoras e fintechs. A lista completa está disponível na tela de conexão."
        },
        {
          question: "É seguro conectar minha conta?",
          answer: "Sim! Utilizamos a Pluggy, empresa certificada pelo Banco Central para operar no Open Finance. Seus dados são criptografados e nunca armazenamos suas senhas bancárias. Você pode revogar o acesso a qualquer momento."
        },
        {
          question: "Com que frequência os dados são atualizados?",
          answer: "Os dados são sincronizados automaticamente diariamente. Você também pode forçar uma atualização manual tocando no botão de sincronização na aba Conexões."
        }
      ]
    },
    {
      category: "Análises e Relatórios",
      questions: [
        {
          question: "Quais análises estão disponíveis?",
          answer: "O Kadig oferece: Evolução do Patrimônio, Distribuição por tipo de ativo, Rentabilidade vs CDI e IPCA, Projeção de crescimento, Cobertura do FGC, Proventos recebidos, Comparador de ativos, Risco x Retorno, Ganho de Capital para IR e Relatórios em PDF."
        },
        {
          question: "O que é o Índice Kadig?",
          answer: "O Índice Kadig é uma pontuação de 0 a 100 que avalia a saúde da sua carteira considerando diversificação, adequação ao perfil, liquidez e rentabilidade. Quanto maior a pontuação, melhor estruturada está sua carteira."
        },
        {
          question: "Como gerar relatórios em PDF?",
          answer: "Acesse a aba Análise e toque em 'Relatórios'. Escolha o tipo de relatório (Patrimônio, Rentabilidade, Proventos, etc.), selecione o período e toque em 'Gerar PDF'. O relatório será baixado automaticamente."
        },
        {
          question: "O que é a cobertura do FGC?",
          answer: "O FGC (Fundo Garantidor de Créditos) protege até R$ 250.000 por CPF por instituição em investimentos como CDBs, LCIs e LCAs. A análise de Cobertura FGC mostra quanto do seu patrimônio em renda fixa está protegido."
        }
      ]
    },
    {
      category: "Preços e Cotações",
      questions: [
        {
          question: "As cotações são em tempo real?",
          answer: "Sim! Para ações, FIIs, ETFs e BDRs listados na B3, as cotações são atualizadas em tempo real durante o pregão. Criptomoedas também têm cotação atualizada constantemente."
        },
        {
          question: "Por que o valor do meu ativo não atualizou?",
          answer: "Verifique se você tem conexão com a internet. Alguns ativos como renda fixa privada e fundos não têm cotação em tempo real e são atualizados diariamente. Você também pode atualizar manualmente editando o ativo."
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const index = categoryIndex * 100 + questionIndex;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`min-h-screen bg-background ${theme === "light" ? "light-theme" : ""}`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top border-b border-border">
        <button 
          onClick={() => navigate("/central-ajuda")}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Perguntas Frequentes</h1>
      </header>

      <div className="p-4 pb-8 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 rounded-2xl p-4 border border-primary/20 text-center"
        >
          <HelpCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre o Kadig
          </p>
        </motion.div>

        {/* FAQ Categories */}
        {faqCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase">
              {category.category}
            </h2>
            <div className="space-y-2">
              {category.questions.map((faq, questionIndex) => {
                const isOpen = openIndex === categoryIndex * 100 + questionIndex;
                return (
                  <div
                    key={faq.question}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-foreground pr-4">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-sm text-muted-foreground">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

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

export default PerguntasFrequentes;
