import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the requesting user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin by checking the users table
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Get the new user data from request body
    const { email, role, department } = await req.json();

    if (!email || !role) {
      throw new Error('Missing required fields');
    }

    // Insert the new user with service role (bypassing RLS)
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, role, department }])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Unauthorized') ? 401 : 400,
      }
    );
  }
});