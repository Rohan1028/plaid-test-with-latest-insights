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
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT2')!;
const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_KEY')!;

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};
const PLAID_BASE_URL = PLAID_BASE_URLS[PLAID_ENV] || PLAID_BASE_URLS['production'];

serve(async (req) => {
  console.log('[plaid-sync-transactions] Request received:', req.method, req.url);
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
      console.warn('[plaid-sync-transactions] Unauthorized request');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('[plaid-sync-transactions] Authenticated user:', user.id);

    const { access_token, months_back = 12 } = await req.json();
    if (!access_token) {
      console.warn('[plaid-sync-transactions] Missing access_token');
      return new Response(JSON.stringify({ error: 'Missing access_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('[plaid-sync-transactions] Starting transaction sync...');

    // Fetch ALL transactions using /transactions/sync (no date filtering)
    let allTransactions: any[] = [];
    let cursor = '';
    let hasMore = true;
    let requestCount = 0;
    let retryCount = 0;
    const maxRetries = 3;

    while (hasMore && requestCount < 10) { // Safety limit
      requestCount++;
      console.log(`[plaid-sync-transactions] Sync request ${requestCount}...`);
      
      const syncRes = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token,
          cursor: cursor,
          options: {
            include_personal_finance_category: true
          }
        })
      });
      
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        // Handle PRODUCT_NOT_READY error with retry
        if (syncData.error_code === 'PRODUCT_NOT_READY' && retryCount < maxRetries) {
          retryCount++;
          const waitTime = Math.min(2000 * retryCount, 10000); // Exponential backoff, max 10s
          console.log(`[plaid-sync-transactions] PRODUCT_NOT_READY, retrying in ${waitTime}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          requestCount--; // Don't count this as a request
          continue;
        }
        
        console.error('[plaid-sync-transactions] Sync failed:', syncData);
        
        // Provide user-friendly error message for PRODUCT_NOT_READY
        if (syncData.error_code === 'PRODUCT_NOT_READY') {
          return new Response(JSON.stringify({ 
            error: 'Bank account is still setting up. This usually takes 1-2 minutes for new connections. Please try again in a moment.',
            error_code: 'PRODUCT_NOT_READY',
            details: syncData 
          }), {
            status: 503, // Service temporarily unavailable
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({ error: 'Plaid sync failed', details: syncData }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add new transactions
      if (syncData.added && syncData.added.length > 0) {
        allTransactions = allTransactions.concat(syncData.added);
        console.log(`[plaid-sync-transactions] Batch ${requestCount}: Added ${syncData.added.length} transactions`);
      }

      cursor = syncData.next_cursor;
      hasMore = syncData.has_more;
      
      // Small delay to be respectful to API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[plaid-sync-transactions] Total transactions synced: ${allTransactions.length}`);

    // Filter by date range after sync
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months_back, now.getDate()).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    
    const filteredTransactions = allTransactions.filter(txn => {
      return txn.date >= startDate && txn.date <= endDate;
    });

    console.log(`[plaid-sync-transactions] Filtered to ${filteredTransactions.length} transactions for date range ${startDate} to ${endDate}`);

    // Generate insights using Azure OpenAI - use raw Plaid data
    let insights = '';
    try {
      console.log('[plaid-sync-transactions] Calling Azure OpenAI for insights');
      console.log('[plaid-sync-transactions] Transaction data for AI:', JSON.stringify(filteredTransactions.slice(0, 2), null, 2));
      console.log('[plaid-sync-transactions] Azure OpenAI endpoint:', AZURE_OPENAI_ENDPOINT ? 'Present' : 'Missing');
      console.log('[plaid-sync-transactions] Azure OpenAI key:', AZURE_OPENAI_KEY ? 'Present' : 'Missing');
      
      const prompt = `You are a friendly financial coach. Analyze this raw transaction data from Plaid and provide exactly 5 concise financial insights as an HTML ordered list (<ol><li>). Each insight should be a single, actionable sentence. Focus on spending patterns, categories, and practical advice. Keep it simple and helpful.

IMPORTANT: Focus on these specific fields in the JSON data:
- "personal_finance_category.primary" and "personal_finance_category.detailed" for accurate spending categories
- "merchant_name" for merchant analysis
- "amount" for spending amounts (positive = expense, negative = income)
- "date" for timing patterns
- "payment_channel" for spending method analysis (online, in-store, etc.)
- "name" for transaction descriptions

Transaction Data:
${JSON.stringify(filteredTransactions, null, 2)}`;
      
      console.log('[plaid-sync-transactions] Sending request to Azure OpenAI...');
      const aiRes = await fetch(AZURE_OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful financial therapy assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });
      
      console.log('[plaid-sync-transactions] Azure OpenAI response status:', aiRes.status);
      console.log('[plaid-sync-transactions] Response headers:', Object.fromEntries(aiRes.headers.entries()));
      
      const aiData = await aiRes.json();
      console.log('[plaid-sync-transactions] Azure OpenAI response:', JSON.stringify(aiData, null, 2));
      
      if (aiRes.status === 404) {
        console.error('[plaid-sync-transactions] 404 Error - Check your endpoint URL and deployment name');
        console.error('[plaid-sync-transactions] Current endpoint:', AZURE_OPENAI_ENDPOINT);
        insights = '<div>⚠️ Azure OpenAI configuration issue (404). Please check your endpoint URL and deployment name.</div>';
      } else if (!aiRes.ok) {
        console.error('[plaid-sync-transactions] Azure OpenAI API error:', aiRes.status, aiData);
        insights = `<div>⚠️ Azure OpenAI API error (${aiRes.status}). Please check your configuration.</div>`;
      } else {
        insights = aiData.choices?.[0]?.message?.content || '';
        console.log('[plaid-sync-transactions] Insights generated:', insights ? `${insights.length} characters` : 'empty');
        console.log('[plaid-sync-transactions] Sample insights:', insights.substring(0, 100) + '...');
        
        if (!insights) {
          console.warn('[plaid-sync-transactions] No insights generated - setting fallback');
          insights = '<div>📊 Your transactions have been loaded successfully! <ul><li>Total transactions: ' + filteredTransactions.length + '</li></ul><span class="insight-summary">Financial insights temporarily unavailable.</span></div>';
        }
      }
    } catch (err) {
      console.error('[plaid-sync-transactions] Azure OpenAI error:', err);
      insights = 'Could not generate insights.';
    }

    return new Response(JSON.stringify({ 
      transactions: filteredTransactions, // Return raw Plaid transactions
      insights,
      total_synced: allTransactions.length,
      filtered_count: filteredTransactions.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[plaid-sync-transactions] Internal server error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
