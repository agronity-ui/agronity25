// Supabase Edge Function: streak-worker
// Deploy: supabase functions deploy streak-worker
// Env: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const auth = req.headers.get('authorization') || '';
  const secret = Deno.env.get('CRON_SECRET') || '';
  if (!secret || auth !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await supabase.rpc('check_expiring_streaks');
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, ranAt: new Date().toISOString() });
});
