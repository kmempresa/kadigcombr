# Central de cibersegurança Kadig + KDG

## Objetivo
Criar uma central no KDG que receba ocorrências suspeitas do app Kadig em tempo quase real. Os alertas serão automáticos, mas avisar, suspender, banir ou liberar uma conta sempre será uma decisão manual do administrador.

## Comportamento definido
- Monitorar entradas suspeitas, ações financeiras incomuns, falhas repetidas, excesso de uso e tentativas de acesso indevido.
- Classificar cada ocorrência como informativa, atenção, alta ou crítica, com usuário, data, origem e motivo.
- Nunca suspender ou banir automaticamente.
- Suspensão e banimento bloqueiam o acesso imediatamente, preservando todos os dados e o histórico para auditoria e reversão.
- Avisos administrativos chegam em tempo real na central de notificações do app.
- Avisos marcados como obrigatórios abrem sobre o app e exigem confirmação de leitura.

## Kadig: detecção e proteção
- Criar registros protegidos para eventos de segurança, estado da conta, comandos administrativos e confirmações de avisos.
- Registrar automaticamente eventos de entrada, novo dispositivo, tentativas falhas, alterações/exclusões financeiras em volume, conexões bancárias repetidas, falhas sensíveis e excesso de requisições.
- Evitar dados sensíveis nos alertas: IP será tratado como dado restrito; tokens, senhas, saldos completos e segredos nunca serão registrados.
- Adicionar limites e deduplicação para impedir que um ataque gere milhares de alertas iguais.
- Aplicar o bloqueio também na camada de dados e nas ações protegidas, não apenas na tela.
- Mostrar telas Kadig específicas para conta suspensa ou banida, com o motivo público e orientação definida pelo administrador.

## Ponte privada com o KDG
- Ampliar a ligação privada existente para entregar eventos, contagens por gravidade, estado das contas e histórico de decisões.
- Criar uma ação privada exclusiva do KDG para: enviar aviso, exigir leitura, suspender, banir, liberar e encerrar sessões.
- Validar rigorosamente cada comando, limitar requisições, manter segredo apenas no servidor e registrar toda ação administrativa.
- Manter os endpoints atuais de usuários e planos compatíveis.

## KDG Control Hub
- Adicionar “Cibersegurança” ao menu, com resumo de alertas abertos, críticos, contas suspensas e eventos recentes.
- Criar filtros por gravidade, tipo, usuário, estado e período; busca por nome ou e-mail.
- Exibir detalhes do evento e histórico completo da conta sem revelar credenciais ou segredos.
- Incluir ações manuais com confirmação: enviar aviso, enviar aviso obrigatório, suspender, banir, liberar e marcar ocorrência como analisada.
- Registrar quem realizou cada ação, quando, motivo e resultado.
- Atualizar automaticamente a central sem depender de recarregar a página.

## Validação
- Testar alertas reais de entrada, alteração financeira, conexão e excesso de tentativas.
- Testar aviso comum e obrigatório chegando ao cliente em tempo real.
- Testar suspensão, banimento e liberação, incluindo sessão já aberta e tentativa de novo acesso.
- Confirmar que dados são preservados, ações ficam auditadas e nenhum segredo aparece no KDG.
- Validar Kadig em iPhone e KDG em celular e computador.

## Limite operacional
Este projeto permite concluir toda a proteção e a ponte no app Kadig. A tela administrativa do KDG precisa ser aplicada no projeto “KDG Control Hub”; o código dele pode ser lido daqui, mas não alterado diretamente nesta conversa. Após a parte Kadig, a etapa final será executada ao abrir esse projeto.
