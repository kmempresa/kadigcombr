/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://appinvestt.lovable.app/email/kadig-logo.png'

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }
const container = { maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }
const logo = { display: 'block', width: '132px', height: 'auto', margin: '0 0 20px' }
const bar = { height: '3px', width: '48px', backgroundColor: '#3399ff', borderRadius: '2px', margin: '0 0 28px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: '#1a2233', margin: '0 0 16px' }
export const text = { fontSize: '15px', color: '#627089', lineHeight: '1.6', margin: '0 0 22px' }
const button = { backgroundColor: '#0080ff', color: '#ffffff', fontSize: '15px', fontWeight: 600 as const, borderRadius: '14px', padding: '14px 26px', textDecoration: 'none' }
export const code = { fontSize: '30px', fontWeight: 700 as const, letterSpacing: '8px', color: '#0a1a33', backgroundColor: '#eef5ff', borderRadius: '14px', padding: '16px', textAlign: 'center' as const, margin: '0 0 22px' }
const footer = { fontSize: '12px', color: '#9aa4b5', lineHeight: '1.5', margin: '32px 0 0', borderTop: '1px solid #e6ebf2', paddingTop: '18px' }

export const KadigEmail = ({ preview, title, children, cta, url, note }: {
  preview: string; title: string; children: React.ReactNode; cta?: string; url?: string; note: string
}) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Kadig" width="132" style={logo} />
        <Section style={bar} />
        <Heading style={h1}>{title}</Heading>
        {children}
        {cta && url && <Button style={button} href={url}>{cta}</Button>}
        <Text style={footer}>{note}<br />Kadig — inteligência para o seu patrimônio.</Text>
      </Container>
    </Body>
  </Html>
)
