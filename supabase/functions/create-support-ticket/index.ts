import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const allowedCategories = new Set(['carteira','investimentos','intelligence','conta','pagamentos','bug','sugestao','outro'])
const allowedTypes = new Set(['image/jpeg','image/png','application/pdf'])
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

  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Sessão inválida' }, 401)

  let form: FormData
  try { form = await req.formData() } catch { return json({ error: 'Dados inválidos' }, 400) }
  const email = String(form.get('email') ?? '').trim()
  const category = String(form.get('category') ?? '')
  const description = String(form.get('description') ?? '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email) || !allowedCategories.has(category) || description.length < 10 || description.length > 5000) {
    return json({ error: 'Confira os campos obrigatórios' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const attachmentPaths: string[] = []
  const files = form.getAll('attachments').filter((value): value is File => value instanceof File)
  if (files.length > 3) return json({ error: 'Envie no máximo 3 anexos' }, 400)
  for (const file of files) {
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) return json({ error: 'Anexo inválido' }, 400)
    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`
    const { error } = await admin.storage.from('support-attachments').upload(path, file, { contentType: file.type, upsert: false })
    if (error) return json({ error: 'Não foi possível enviar o anexo' }, 500)
    attachmentPaths.push(path)
  }

  const { data, error } = await admin.from('support_tickets').insert({
    user_id: user.id, email, category, description, attachment_paths: attachmentPaths,
  }).select('id').single()
  if (error || !data) return json({ error: 'Não foi possível abrir o chamado' }, 500)
  return json({ success: true, id: data.id })
})
