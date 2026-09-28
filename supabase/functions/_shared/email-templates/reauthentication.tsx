/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { KadigEmail, text, code } from './layout.tsx'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <KadigEmail preview="Seu código de verificação Kadig" title="Código de verificação"
    note="O código expira em pouco tempo. Nunca compartilhe este código com ninguém, nem com a equipe Kadig.">
    <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
    <Text style={code}>{token}</Text>
  </KadigEmail>
)
export default ReauthenticationEmail
