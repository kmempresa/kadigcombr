/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text } from './layout.tsx'

interface Props { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ recipient, confirmationUrl }: Props) => (
  <KadigEmail preview="Confirme seu e-mail para entrar na Kadig" title="Confirme seu e-mail"
    cta="Confirmar e-mail" url={confirmationUrl}
    note="Se você não criou uma conta na Kadig, ignore este e-mail.">
    <Text style={text}>Falta pouco. Confirme o endereço {recipient} para ativar sua conta e começar a encontrar oportunidades no seu patrimônio.</Text>
  </KadigEmail>
)
export default SignupEmail
