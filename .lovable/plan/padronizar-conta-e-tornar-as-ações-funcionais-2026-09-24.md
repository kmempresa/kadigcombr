# Padronizar Conta e tornar as ações funcionais

## Alterações
- Unificar Segurança, Preferências, Suporte e Sobre no mesmo padrão visual Kadig, com cabeçalho, espaçamento, cores, áreas seguras do iPhone e rolagem consistentes.
- Colocar a verificação em duas etapas dentro de Segurança e removê-la do perfil.
- Corrigir o fluxo de duas etapas: carregar o estado real, gerar QR Code, confirmar o código, cancelar sem deixar cadastro pendente e desativar com confirmação segura.
- Tornar Segurança funcional: troca de senha validada, sessão atual identificada, ação para encerrar outras sessões e exclusão da conta feita no servidor, sem remoção parcial de dados.
- Tornar Preferências persistentes para o usuário, mantendo tema e escolhas de notificações após fechar o aplicativo.
- Tornar Suporte real: registrar chamados e anexos no banco da Kadig, exibir confirmação e impedir envio duplicado.
- Revisar os links de Sobre e o retorno de todas as quatro áreas para a aba Conta.

## Dados e segurança
- Criar armazenamento protegido para preferências e chamados, acessível somente pelo próprio usuário.
- Criar funções privadas para anexos e exclusão completa da conta, sempre validando a sessão da pessoa.
- Não simular biometria nem dispositivos: ações sem suporte real serão substituídas por opções que realmente funcionam.

## Validação
- Testar todas as quatro entradas a partir de Conta no tamanho atual do iPhone, nos modos claro e escuro.
- Testar salvar preferências, abrir chamado, alterar senha, encerrar outras sessões e o ciclo completo de ativar/desativar duas etapas.
- Confirmar retorno correto para Conta, rolagem sem cortes e aplicativo sem erros.
