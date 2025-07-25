import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!;
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!;
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};
const PLAID_BASE_URL = PLAID_BASE_URLS[PLAID_ENV] || PLAID_BASE_URLS['production'];

serve(async (req) => {
  console.log('[plaid-link-token] Request received:', req.method, req.url);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'GET') {
    console.warn('[plaid-link-token] Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  try {
    // In production, use the authenticated user's ID
    // For demo, use a static user ID
    const userId = 'test-user';
    console.log('[plaid-link-token] Calling Plaid /link/token/create for user:', userId);
    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        client_name: "Incluya App",
        language: "en",
        country_codes: ["US"],
        user: { client_user_id: userId },
        products: ["transactions"]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[plaid-link-token] Plaid API error:', data);
      return new Response(JSON.stringify({ error: 'Failed to create link token', details: data }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('[plaid-link-token] Link token created successfully');
    return new Response(JSON.stringify({ link_token: data.link_token }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[plaid-link-token] Internal server error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
