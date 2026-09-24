import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  const authorization = req.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Não autorizado' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return json({ error: 'Sessão inválida' }, 401)

  let body: unknown
  try { body = await req.json() } catch { return json({ error: 'Confirmação inválida' }, 400) }
  if (typeof body !== 'object' || body === null || !('confirmation' in body) || body.confirmation !== 'EXCLUIR') {
    return json({ error: 'Digite EXCLUIR para confirmar' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: 'Não foi possível excluir a conta' }, 500)
  return json({ success: true })
})
