/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text } from './layout.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: Props) => (
  <KadigEmail preview="Seu link de acesso à Kadig" title="Seu link de acesso"
    cta="Entrar na Kadig" url={confirmationUrl}
    note="O link expira em pouco tempo. Se não foi você, ignore este e-mail.">
    <Text style={text}>Toque no botão abaixo para entrar na sua conta Kadig.</Text>
  </KadigEmail>
)
export default MagicLinkEmail
