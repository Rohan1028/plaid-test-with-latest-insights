import React, { useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_REF = 'lnjxsfxymutsksmzduss';
const SUPABASE_FUNCTIONS_BASE = `https://${SUPABASE_PROJECT_REF}.functions.supabase.co`;
const PLAID_LINK_TOKEN_URL = `${SUPABASE_FUNCTIONS_BASE}/plaid-link-token`;
const EDGE_FUNCTION_URL = `${SUPABASE_FUNCTIONS_BASE}/plaid-transactions`;
const SYNC_FUNCTION_URL = `${SUPABASE_FUNCTIONS_BASE}/plaid-sync-transactions`;

// Add Plaid to the window type
declare global {
  interface Window {
    Plaid: any;
  }
}

const PlaidTransactionsPage = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthsBack, setMonthsBack] = useState<number>(12); // Default to 1 year
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load Plaid Link script
  React.useEffect(() => {
    if (!window.Plaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handler to open Plaid Link
  const openPlaidLink = async () => {
    setError(null);
    setLoading(true);
    try {
      // Get Supabase access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('User not authenticated');

      // Fetch link token from edge function (production URL, no /functions/v1/)
      const res = await fetch(PLAID_LINK_TOKEN_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.link_token) throw new Error('Failed to get Plaid link token');
      setLinkToken(data.link_token);
      setLoading(false);
      // @ts-ignore
      const handler = window.Plaid.create({
        token: data.link_token,
        onSuccess: async (public_token: string) => {
          setLoading(true);
          try {
            // Get auth token first
            const { data: { session } } = await supabase.auth.getSession();
            const authToken = session?.access_token;
            if (!authToken) throw new Error('User not authenticated');

            setError('Bank connected successfully! Waiting 15 seconds for account to be ready...');
            setIsConnected(true);
            
            // Wait 15 seconds before attempting any transaction fetches
            // This gives Plaid time to sync with the bank
            console.log('Waiting 15 seconds for bank account to be ready...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            setError('Account ready. Fetching your transactions...');

            // Exchange public token for access token first
            const resp = await fetch(EDGE_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ public_token, months_back: monthsBack })
            });
            const result = await resp.json();
            
            // Store access token for future sync calls
            if (result.access_token) {
              setAccessToken(result.access_token);
              console.log('Access token stored for sync calls:', result.access_token.substring(0, 20) + '...');
            } else {
              console.error('No access_token in response:', result);
            }
            
            // Always use sync function for comprehensive transaction data and insights
            console.log('Initial fetch complete. Starting comprehensive transaction sync for best results...');
            console.log('Initial result:', { hasError: !!result.error, hasTransactions: !!result.transactions, transactionCount: result.transactions?.length || 0 });
            setError('Starting comprehensive transaction sync...');
            
            // Automatically call server refresh
            try {
              if (!result.access_token) {
                throw new Error('No access token available for sync - token exchange may have failed');
              }
              
              console.log('Auto-calling sync function with access token:', result.access_token ? 'Present (' + result.access_token.substring(0, 20) + '...)' : 'Missing');
              console.log('Sync request body:', { access_token: result.access_token ? 'Present' : 'Missing', months_back: monthsBack });
              const syncResp = await fetch(SYNC_FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ access_token: result.access_token, months_back: monthsBack })
              });
              
              const syncResult = await syncResp.json();
              if (syncResult.error) {
                if (syncResult.error_code === 'PRODUCT_NOT_READY') {
                  // Automatically retry after shorter delay since we already waited 15s
                  setError('Bank account still setting up. Auto-retrying in 20 seconds...');
                  setTimeout(async () => {
                    setError('Retrying transaction sync...');
                    try {
                      const retryResp = await fetch(SYNC_FUNCTION_URL, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${authToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ access_token: result.access_token, months_back: monthsBack })
                      });
                      
                      const retryResult = await retryResp.json();
                      if (retryResult.error) {
                        if (retryResult.error_code === 'PRODUCT_NOT_READY') {
                          setError('Bank account is still setting up. One final retry in 40 seconds...');
                          // One more retry after 40 more seconds
                          setTimeout(async () => {
                            try {
                              const finalResp = await fetch(SYNC_FUNCTION_URL, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${authToken}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ access_token: result.access_token, months_back: monthsBack })
                              });
                              const finalResult = await finalResp.json();
                              if (!finalResult.error) {
                                setTransactions(finalResult.transactions || []);
                                setInsights(finalResult.insights || '');
                                setError(null);
                                setLoading(false);
                                console.log(`Final retry successful: ${finalResult.total_synced} total transactions`);
                              } else {
                                setError('Bank connection is taking longer than expected. Please try connecting again later.');
                                setLoading(false);
                              }
                            } catch (finalErr) {
                              setError('Auto-retry failed. Please try connecting again later.');
                              setLoading(false);
                            }
                          }, 40000); // Wait 40 seconds for final retry
                        } else {
                          setError(`Retry failed: ${retryResult.error}`);
                          setLoading(false);
                        }
                      } else {
                        setTransactions(retryResult.transactions || []);
                        setInsights(retryResult.insights || '');
                        setError(null);
                        setLoading(false);
                        console.log(`Retry successful: ${retryResult.total_synced} total transactions`);
                      }
                    } catch (retryErr) {
                      setError('Auto-retry failed. Please try connecting again later.');
                      setLoading(false);
                    }
                  }, 20000); // Wait 20 seconds before retry
                  return;
                } else {
                  setError(`Auto-sync failed: ${syncResult.error}`);
                  setLoading(false);
                  return;
                }
              }
              
              setTransactions(syncResult.transactions || []);
              setInsights(syncResult.insights || '');
              setError(null);
              setLoading(false);
              console.log(`Auto-sync completed: ${syncResult.total_synced} total transactions, ${syncResult.filtered_count} in selected time range`);
              console.log('Sync result insights:', syncResult.insights ? `${syncResult.insights.length} characters` : 'empty');
              console.log('Transactions received:', syncResult.transactions?.length || 0);
              console.log('Sample transaction:', syncResult.transactions?.[0]);
            } catch (syncErr: any) {
              setError(`Auto-sync failed: ${syncErr.message}`);
              setLoading(false);
            }
          } catch (err: any) {
            setError(err.message || 'Failed to fetch transactions');
            setLoading(false);
          }
        },
        onExit: (err: any) => {
          if (err) setError('Plaid Link exited: ' + err.display_message || err.error_message);
        },
      });
      handler.open();
    } catch (err: any) {
      setError(err.message || 'Failed to open Plaid Link');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <div className="transform transition-all duration-700 ease-out">
        <ChatSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-6 animate-fade-in">
          <h1 className="text-4xl font-light text-white tracking-wide mb-6">Plaid Transactions & Insights</h1>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Time Period</label>
              <Select value={monthsBack.toString()} onValueChange={(value) => setMonthsBack(parseInt(value))}>
                <SelectTrigger className="w-48 bg-gray-900 border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="3" className="text-white hover:bg-gray-800">Last 3 months</SelectItem>
                  <SelectItem value="6" className="text-white hover:bg-gray-800">Last 6 months</SelectItem>
                  <SelectItem value="12" className="text-white hover:bg-gray-800">Last 1 year</SelectItem>
                  <SelectItem value="24" className="text-white hover:bg-gray-800">Last 2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-6"></div> {/* Spacer to align button with select */}
              <Button onClick={openPlaidLink} disabled={loading} variant="default" size="lg">
                {loading ? 'Connecting...' : 'Connect Your Bank'}
              </Button>
            </div>
          </div>
          {error && <div className="mt-4 text-red-400">{error}</div>}
        </div>
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          {transactions.length > 0 && (
            <Card className="mb-8 bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>
                  Transactions - Last {monthsBack} month{monthsBack !== 1 ? 's' : ''} ({transactions.length} found)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn, i) => (
                        <tr key={i} className="border-b border-gray-800">
                          <td className="px-4 py-2">{txn.date}</td>
                          <td className="px-4 py-2">
                            <div className="font-medium">{txn.name}</div>
                            {txn.merchant_name && txn.merchant_name !== txn.name && (
                              <div className="text-xs text-gray-400">{txn.merchant_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {Array.isArray(txn.category) 
                              ? txn.category.join(' > ') 
                              : (txn.category || 'Uncategorized')
                            }
                          </td>
                          <td className="px-4 py-2">
                            <span className={txn.amount > 0 ? 'text-red-400' : 'text-green-400'}>
                              {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {txn.iso_currency_code || txn.unofficial_currency_code || 'USD'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {insights && (
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Financial Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: insights }} />
              </CardContent>
            </Card>
          )}
          {/* Debug info */}
          <div className="mt-4 p-4 bg-gray-800 text-white text-xs">
            <div>Debug Info:</div>
            <div>Insights state: {insights ? `"${insights.substring(0, 100)}..."` : 'EMPTY/NULL'}</div>
            <div>Insights length: {insights?.length || 0}</div>
            <div>Insights type: {typeof insights}</div>
            <div>Transactions count: {transactions.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaidTransactionsPage; 