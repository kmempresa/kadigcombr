import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
function authorized(req: Request) {
  const expected = Deno.env.get('KDG_BRIDGE_SECRET') ?? ''
  const auth = req.headers.get('authorization') ?? ''
  const got = req.headers.get('x-kdg-secret') ?? (auth.startsWith('Bearer ') ? auth.slice(7) : '')
  if (expected.length < 16 || got.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i)
  return diff === 0
}
const schema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(['notice', 'suspend', 'ban', 'release', 'mark_reviewing', 'resolve', 'dismiss']),
  actor: z.string().min(2).max(120),
  reason: z.string().max(1000).optional(),
  public_message: z.string().min(3).max(1000).optional(),
  mandatory_notice: z.boolean().default(false),
  security_event_id: z.string().uuid().optional(),
}).superRefine((v, ctx) => {
  if (v.action === 'notice' && !v.public_message) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['public_message'], message: 'Mensagem obrigatória' })
  if (['suspend', 'ban'].includes(v.action) && !v.reason) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Motivo obrigatório' })
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)
  if (!authorized(req)) return json({ error: 'Não autorizado' }, 401)
  let raw: unknown
  try { raw = await req.json() } catch { return json({ error: 'Dados inválidos' }, 400) }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const url = Deno.env.get('SUPABASE_URL')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !service) return json({ error: 'Serviço indisponível' }, 503)
  const admin = createClient(url, service)
  const d = parsed.data
  const { data: profile } = await admin.from('profiles').select('user_id').eq('user_id', d.user_id).maybeSingle()
  if (!profile) return json({ error: 'Usuário não encontrado' }, 404)

  if (d.action === 'notice') {
    const { error } = await admin.from('notifications').insert({
      user_id: d.user_id,
      title: d.mandatory_notice ? 'Aviso importante da Kadig' : 'Aviso da Kadig',
      message: d.public_message,
      type: d.mandatory_notice ? 'alert' : 'warning',
      category: 'security',
      data: { mandatory: d.mandatory_notice, source: 'kdg' },
    })
    if (error) return json({ error: 'Não foi possível enviar o aviso' }, 500)
  }

  if (['suspend', 'ban', 'release'].includes(d.action)) {
    const status = d.action === 'release' ? 'active' : d.action === 'ban' ? 'banned' : 'suspended'
    const { error } = await admin.from('account_security_controls').upsert({
      user_id: d.user_id,
      status,
      public_reason: d.action === 'release' ? null : (d.public_message ?? 'Entre em contato com o suporte da Kadig.'),
      internal_reason: d.reason ?? null,
      actioned_by: d.actor,
      actioned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (error) return json({ error: 'Não foi possível alterar o acesso' }, 500)
    const banDuration = d.action === 'release' ? 'none' : '876000h'
    const { error: authError } = await admin.auth.admin.updateUserById(d.user_id, { ban_duration: banDuration })
    if (authError) return json({ error: 'A situação foi salva, mas a sessão não pôde ser encerrada' }, 500)
  }

  if (d.security_event_id && ['mark_reviewing', 'resolve', 'dismiss'].includes(d.action)) {
    const status = d.action === 'mark_reviewing' ? 'reviewing' : d.action === 'resolve' ? 'resolved' : 'dismissed'
    await admin.from('security_events').update({ status, resolved_at: status === 'reviewing' ? null : new Date().toISOString(), resolved_by: d.actor }).eq('id', d.security_event_id)
  }

  await admin.from('security_admin_actions').insert({
    user_id: d.user_id, action: d.action, reason: d.reason, public_message: d.public_message,
    mandatory_notice: d.mandatory_notice, actor: d.actor, security_event_id: d.security_event_id,
  })
  return json({ success: true })
})
