/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text } from './layout.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <KadigEmail preview="Redefina sua senha da Kadig" title="Redefinir senha"
    cta="Criar nova senha" url={confirmationUrl}
    note="Se você não pediu para trocar a senha, ignore este e-mail. Sua senha continua a mesma.">
    <Text style={text}>Recebemos um pedido para redefinir a senha da sua conta Kadig. Toque no botão abaixo para criar uma nova.</Text>
  </KadigEmail>
)
export default RecoveryEmail
