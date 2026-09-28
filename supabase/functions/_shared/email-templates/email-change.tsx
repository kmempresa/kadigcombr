/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text } from './layout.tsx'

interface Props { siteName: string; oldEmail?: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ email, newEmail, confirmationUrl }: Props) => (
  <KadigEmail preview="Confirme a troca do seu e-mail na Kadig" title="Confirme seu novo e-mail"
    cta="Confirmar troca" url={confirmationUrl}
    note="Se você não pediu esta troca, proteja sua conta alterando a senha agora.">
    <Text style={text}>Você pediu para trocar o e-mail da sua conta Kadig de {email} para {newEmail}.</Text>
  </KadigEmail>
)
export default EmailChangeEmail
