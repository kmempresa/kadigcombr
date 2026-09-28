/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text } from './layout.tsx'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: Props) => (
  <KadigEmail preview="Você foi convidado para a Kadig" title="Você foi convidado"
    cta="Aceitar convite" url={confirmationUrl}
    note="Se você não esperava este convite, ignore este e-mail.">
    <Text style={text}>Você recebeu um convite para entrar na Kadig. Toque no botão abaixo para criar seu acesso.</Text>
  </KadigEmail>
)
export default InviteEmail
