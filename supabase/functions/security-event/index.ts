import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const schema = z.object({
  event_type: z.enum(['login_success', 'new_device', 'mfa_failure', 'forbidden_access', 'rate_limit', 'sensitive_failure']),
  severity: z.enum(['info', 'attention', 'high', 'critical']).default('info'),
  title: z.string().min(3).max(120),
  summary: z.string().min(3).max(500),
  fingerprint: z.string().min(8).max(180).optional(),
  metadata: z.record(z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).default({}),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)
  const auth = req.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!auth?.startsWith('Bearer ') || !url || !anon || !service) return json({ error: 'Não autorizado' }, 401)
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data, error } = await userClient.auth.getClaims(auth.slice(7))
  const userId = data?.claims?.sub
  if (error || typeof userId !== 'string') return json({ error: 'Sessão inválida' }, 401)
  let raw: unknown
  try { raw = await req.json() } catch { return json({ error: 'Dados inválidos' }, 400) }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const admin = createClient(url, service)
  const fingerprint = parsed.data.fingerprint ? `${userId}:${parsed.data.fingerprint}` : null
  if (fingerprint) {
    const { data: existing } = await admin.from('security_events').select('id, occurrence_count').eq('fingerprint', fingerprint).in('status', ['open', 'reviewing']).maybeSingle()
    if (existing) {
      await admin.from('security_events').update({ occurrence_count: existing.occurrence_count + 1, last_seen_at: new Date().toISOString(), severity: parsed.data.severity }).eq('id', existing.id)
      return json({ success: true, deduplicated: true })
    }
  }
  const { error: insertError } = await admin.from('security_events').insert({ user_id: userId, ...parsed.data, fingerprint, source: 'app' })
  if (insertError) return json({ error: 'Não foi possível registrar o evento' }, 500)
  return json({ success: true })
})
