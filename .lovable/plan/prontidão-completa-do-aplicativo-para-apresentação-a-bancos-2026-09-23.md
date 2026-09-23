# Prontidão completa do aplicativo para apresentação a bancos

## Objetivo
Deixar todos os fluxos do Kadig confiáveis, com dados rastreáveis, estados de erro claros e nenhuma informação simulada apresentada como real.

## Etapas

1. **Segurança e acesso**
   - Revisar login, criação de conta, recuperação de sessão, saída e proteção de telas privadas.
   - Conferir permissões para garantir que cada cliente veja e altere somente os próprios dados.
   - Revisar exposição de informações sensíveis, links externos e funções financeiras.

2. **Dados financeiros reais**
   - Mapear a origem de cada número exibido em Carteira, Intelligence, Trade, Conexões e Mercado.
   - Remover índices, rankings, taxas e resultados fixos ou simulados que possam parecer atuais.
   - Distinguir claramente valores reais, estimativas financeiras e dados indisponíveis.
   - Corrigir cálculos de patrimônio, rentabilidade, CDI, IPCA, metas, risco e cenários.

3. **Mercado e Trade**
   - Reduzir drasticamente as consultas repetidas às fontes externas.
   - Implementar cache compartilhado e atualização controlada para evitar novo bloqueio por cota.
   - Criar estados honestos de indisponibilidade e última atualização, sem mostrar números antigos como atuais.
   - Validar busca, favoritos, detalhes de ativos, notícias, agenda e dividendos.

4. **Fluxos completos do cliente**
   - Testar cadastro, onboarding, conexão bancária, sincronização, carteira, movimentações, metas, Intelligence, downloads e assinatura.
   - Corrigir botões sem ação, telas vazias, carregamentos infinitos, formulários inconsistentes e falhas no iOS.
   - Validar atualização automática dos dados após conexão ou alteração.

5. **Qualidade para demonstração e produção**
   - Criar testes para cálculos e jornadas críticas, hoje praticamente sem cobertura.
   - Verificar celular e desktop, mensagens de erro e estados sem dados.
   - Executar auditoria de dependências e segurança.
   - Entregar um resumo objetivo do que foi validado, fontes externas usadas e qualquer risco que dependa de contrato, chave ou limite de fornecedor.

## Prioridade inicial já identificada
Trade e Mercado dependem de fontes externas cuja cota está esgotada. Também existem índices e um ranking de desempenho fixos no aplicativo. Esses pontos serão corrigidos primeiro porque podem exibir telas vazias ou informações desatualizadas em uma demonstração.

## Critério de conclusão
Nenhum erro conhecido nos fluxos testados, compilação limpa, testes críticos aprovados, ausência de números fictícios apresentados como atuais e falhas externas tratadas sem enganar o usuário.
