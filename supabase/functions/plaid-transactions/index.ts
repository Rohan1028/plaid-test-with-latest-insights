import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

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

const PLAID_LINK_TOKEN_URL = '/functions/v1/plaid-link-token';

serve(async (req) => {
  console.log('[plaid-transactions] Request received:', req.method, req.url);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.warn('[plaid-transactions] Unauthorized request');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('[plaid-transactions] Authenticated user:', user.id);

    const { public_token, months_back = 12 } = await req.json();
    if (!public_token) {
      console.warn('[plaid-transactions] Missing public_token');
      return new Response(JSON.stringify({ error: 'Missing public_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('[plaid-transactions] Exchanging public_token for access_token');

    // 1. Exchange public_token for access_token
    const exchangeRes = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token
      })
    });
    const exchangeData = await exchangeRes.json();
    if (!exchangeRes.ok) {
      console.error('[plaid-transactions] Plaid token exchange failed:', exchangeData);
      return new Response(JSON.stringify({ error: 'Plaid token exchange failed', details: exchangeData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const access_token = exchangeData.access_token;
    console.log('[plaid-transactions] Access token received');

    // 2. Quick transaction check to validate the connection
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months_back, now.getDate()).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    console.log(`[plaid-transactions] Quick transaction check from ${startDate} to ${endDate}`);
    
    const txRes = await fetch(`${PLAID_BASE_URL}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
        start_date: startDate,
        end_date: endDate,
        options: { count: 10, offset: 0 } // Just a small check
      })
    });
    const txData = await txRes.json();
    
    if (!txRes.ok) {
      console.error('[plaid-transactions] Quick transaction check failed:', txData);
      // Return access_token even on error so sync can use it
      return new Response(JSON.stringify({ 
        error: 'Initial transaction check failed - will use sync instead', 
        details: txData, 
        access_token,
        transactions: []
      }), {
        status: 200, // Changed to 200 since this is expected for new accounts
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const transactions = txData.transactions || [];
    console.log(`[plaid-transactions] Quick check found ${transactions.length} transactions - sync will get comprehensive data`);

    // Return basic transaction info and access_token (no insights - sync will handle that)
    return new Response(JSON.stringify({ 
      transactions: transactions.slice(0, 5), // Just return a few as preview
      access_token,
      message: 'Basic check complete - comprehensive sync will follow'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[plaid-transactions] Internal server error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
