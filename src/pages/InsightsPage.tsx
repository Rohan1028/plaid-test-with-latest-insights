
import React, { useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_REF = 'lnjxsfxymutsksmzduss';
const SUPABASE_FUNCTIONS_BASE = `https://${SUPABASE_PROJECT_REF}.functions.supabase.co`;
const PLAID_LINK_TOKEN_URL = `${SUPABASE_FUNCTIONS_BASE}/plaid-link-token`;
const EDGE_FUNCTION_URL = `${SUPABASE_FUNCTIONS_BASE}/plaid-transactions`;
const GENERATE_INSIGHTS_URL = `${SUPABASE_FUNCTIONS_BASE}/generate-insights`;

// Add Plaid to the window type
declare global {
  interface Window {
    Plaid: any;
  }
}

interface Insight {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  bgColor: string;
  span: string;
}

const InsightsPage = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Helper function to assign insight types based on index
  const getInsightType = (index: number) => {
    const types = ['wins-amplifier', 'shame-detector', 'reality-gap', 'family-pattern'];
    return types[index] || 'general-insight';
  };

  // Fallback placeholder insights
  const getPlaceholderInsights = (): Insight[] => [
    {
      id: 1,
      type: 'wins-amplifier',
      title: "Connect your bank account to see personalized insights",
      subtitle: "We'll analyze your financial patterns to provide helpful guidance",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 2,
      type: 'shame-detector',
      title: 'Your financial journey is unique',
      subtitle: "Everyone's path looks different - there's no perfect timeline",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 3,
      type: 'reality-gap',
      title: 'Small steps create lasting change',
      subtitle: "Progress isn't always visible day-to-day, but it adds up",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 4,
      type: 'family-pattern',
      title: 'You have more control than you think',
      subtitle: "Breaking patterns takes time, but every choice matters",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    }
  ];

  // Handler to open Plaid Link (same pattern as PlaidTransactionsPage)
  const openPlaidLink = async () => {
    setError(null);
    setLoading(true);
    setInsights(getPlaceholderInsights()); // Reset to placeholder while connecting
    
    try {
      // Get Supabase access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('User not authenticated');

      // Fetch link token from edge function
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
              body: JSON.stringify({ public_token, months_back: 12 })
            });
            const result = await resp.json();
            
            // Store access token for insight generation
            if (result.access_token) {
              setAccessToken(result.access_token);
              console.log('Access token stored for insights:', result.access_token.substring(0, 20) + '...');
            } else {
              console.error('No access_token in response:', result);
            }
            
            // Generate insights using the access token
            console.log('Initial fetch complete. Starting insights generation...');
            setError('Generating your personalized insights...');
            
            try {
              if (!result.access_token) {
                throw new Error('No access token available for insights - token exchange may have failed');
              }
              
              console.log('Calling generate-insights with access token:', result.access_token ? 'Present (' + result.access_token.substring(0, 20) + '...)' : 'Missing');
              const insightsResp = await fetch(GENERATE_INSIGHTS_URL, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ access_token: result.access_token })
              });
              
              const insightsResult = await insightsResp.json();
              if (insightsResult.error) {
                if (insightsResult.error_code === 'PRODUCT_NOT_READY') {
                  // Automatically retry after shorter delay since we already waited 15s
                  setError('Bank account still setting up. Auto-retrying in 20 seconds...');
                  setTimeout(async () => {
                    setError('Retrying insights generation...');
                    try {
                      const retryResp = await fetch(GENERATE_INSIGHTS_URL, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${authToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ access_token: result.access_token })
                      });
                      
                      const retryResult = await retryResp.json();
                      if (retryResult.error) {
                        if (retryResult.error_code === 'PRODUCT_NOT_READY') {
                          setError('Bank account is still setting up. One final retry in 40 seconds...');
                          // One more retry after 40 more seconds
                          setTimeout(async () => {
                            try {
                              const finalResp = await fetch(GENERATE_INSIGHTS_URL, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${authToken}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ access_token: result.access_token })
                              });
                              const finalResult = await finalResp.json();
                              if (!finalResult.error && finalResult.insights) {
                                const formattedInsights: Insight[] = finalResult.insights.map((insight: any, index: number) => ({
                                  id: index + 1,
                                  type: insight.type || getInsightType(index),
                                  title: insight.title || insight.display || 'Insight',
                                  subtitle: insight.subtitle || insight.detail || '',
                                  bgColor: 'bg-gray-800',
                                  span: 'col-span-1 row-span-1'
                                }));
                                setInsights(formattedInsights);
                                setError(null);
                                setLoading(false);
                                console.log('Final retry successful: insights generated');
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
                      } else if (retryResult.insights) {
                        const formattedInsights: Insight[] = retryResult.insights.map((insight: any, index: number) => ({
                          id: index + 1,
                          type: insight.type || getInsightType(index),
                          title: insight.title || insight.display || 'Insight',
                          subtitle: insight.subtitle || insight.detail || '',
                          bgColor: 'bg-gray-800',
                          span: 'col-span-1 row-span-1'
                        }));
                        setInsights(formattedInsights);
                        setError(null);
                        setLoading(false);
                        console.log('Retry successful: insights generated');
                      }
                    } catch (retryErr) {
                      setError('Auto-retry failed. Please try connecting again later.');
                      setLoading(false);
                    }
                  }, 20000); // Wait 20 seconds before retry
                  return;
                } else {
                  setError(`Insights generation failed: ${insightsResult.error}`);
                  setLoading(false);
                  return;
                }
              }
              
              if (insightsResult.insights && Array.isArray(insightsResult.insights)) {
                const formattedInsights: Insight[] = insightsResult.insights.map((insight: any, index: number) => ({
                  id: index + 1,
                  type: insight.type || getInsightType(index),
                  title: insight.title || insight.display || 'Insight',
                  subtitle: insight.subtitle || insight.detail || '',
                  bgColor: 'bg-gray-800',
                  span: 'col-span-1 row-span-1'
                }));
                setInsights(formattedInsights);
                setError(null);
                setLoading(false);
                console.log('Insights generation completed successfully');
              } else {
                throw new Error('Invalid insights format received');
              }
            } catch (insightsErr: any) {
              setError(`Insights generation failed: ${insightsErr.message}`);
              setLoading(false);
            }
          } catch (err: any) {
            setError(err.message || 'Failed to generate insights');
            setLoading(false);
          }
        },
        onExit: (err: any) => {
          if (err) setError('Plaid Link exited: ' + err.display_message || err.error_message);
          setLoading(false);
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
        {/* Header */}
        <div className="px-8 pt-8 pb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-light text-white tracking-wide">Insights.</h1>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={openPlaidLink} 
                disabled={loading} 
                variant="default" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Connecting...' : isConnected ? 'Refresh Insights' : 'Connect Your Bank'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Insights Grid */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          {loading && !isConnected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Setting up Plaid connection...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 h-full max-h-[600px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {insights.map((insight, index) => (
                  <Card
                    key={insight.id}
                    className={`${insight.bgColor} border-0 hover:scale-[1.03] transition-all duration-500 cursor-pointer relative overflow-hidden group`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fade-in 0.8s ease-out forwards'
                    }}
                  >
                    <CardContent className="p-6 h-full flex flex-col justify-between relative">
                      {/* Subtle glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                      
                      <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <h3 className="font-medium mb-3 text-white leading-relaxed transition-all duration-300 group-hover:transform group-hover:translate-y-[-2px] text-lg">
                          {insight.title}
                        </h3>
                        
                        {insight.subtitle && (
                          <p className="text-white/70 leading-relaxed transition-all duration-300 group-hover:text-white/90 text-sm">
                            {insight.subtitle}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bottom Section with enhanced styling */}
              <div className="border-t border-gray-800 pt-8 mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full transition-all duration-300 group-hover:bg-gray-700 group-hover:scale-110">
                      <Leaf className="h-6 w-6 text-green-400 transition-all duration-300 group-hover:text-green-300" />
                    </div>
                    <div className="transition-all duration-300 group-hover:transform group-hover:translate-x-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">
                        LET'S INTERRUPT THE LOOP
                      </p>
                      <p className="text-white text-lg">
                        Even a 10 min chat could shift your rhythm.
                      </p>
                    </div>
                  </div>
                  
                  <Button className="bg-gray-700 hover:bg-gray-600 text-white border-0 px-8 py-3 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Check-in
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
