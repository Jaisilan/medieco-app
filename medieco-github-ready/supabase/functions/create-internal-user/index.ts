import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const allowedRoles = [
  'admin',
  'order_manager',
  'affiliate_manager',
  'support_staff',
  'product_manager',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user: caller },
      error: callerError,
    } = await adminClient.auth.getUser(token)

    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || callerProfile?.role !== 'master_admin') {
      return new Response(
        JSON.stringify({ error: 'Only master_admin can create internal users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()

    const full_name = String(body.full_name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const password = String(body.password || '').trim()
    const role = String(body.role || '').trim()

    if (!full_name || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Full name, email, password and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid internal role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: createdUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
        },
      })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const userId = createdUser.user.id

    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email,
        phone,
        role,
        updated_at: new Date().toISOString(),
      })

    if (profileUpdateError) {
      return new Response(
        JSON.stringify({ error: profileUpdateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        role,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})