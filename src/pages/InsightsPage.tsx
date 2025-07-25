
import React, { useEffect, useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Leaf } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_REF = 'lnjxsfxymutsksmzduss';
const SUPABASE_FUNCTIONS_BASE = `https://${SUPABASE_PROJECT_REF}.functions.supabase.co`;
const GENERATE_INSIGHTS_URL = `${SUPABASE_FUNCTIONS_BASE}/generate-insights`;

interface Insight {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  bgColor: string;
  span: string;
}

const InsightsPage = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Plaid access token from localStorage (same pattern as PlaidTransactionsPage)
  const getPlaidAccessToken = () => {
    try {
      const tokenData = localStorage.getItem('plaidAccessToken');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.access_token || parsed;
      }
      return null;
    } catch (error) {
      console.error('Error parsing Plaid access token:', error);
      return null;
    }
  };

  const fetchInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = getPlaidAccessToken();
      if (!accessToken) {
        setError('No Plaid connection found. Please connect your bank account first.');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(GENERATE_INSIGHTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch insights: ${errorData}`);
      }

      const data = await response.json();
      
      if (data.insights && Array.isArray(data.insights)) {
        // Map the LLM insights to our UI format
        const formattedInsights: Insight[] = data.insights.map((insight: any, index: number) => ({
          id: index + 1,
          type: insight.type || getInsightType(index),
          title: insight.title || insight.display || 'Insight',
          subtitle: insight.subtitle || insight.detail || '',
          bgColor: 'bg-gray-800',
          span: 'col-span-1 row-span-1'
        }));
        
        setInsights(formattedInsights);
      } else {
        throw new Error('Invalid insights format received');
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch insights');
      // Fall back to placeholder insights on error
      setInsights(getPlaceholderInsights());
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (user) {
      fetchInsights();
    } else {
      setInsights(getPlaceholderInsights());
      setLoading(false);
    }
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-black text-white overflow-hidden">
        <div className="transform transition-all duration-700 ease-out">
          <ChatSidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-4xl font-light text-white tracking-wide">Insights.</h1>
          </div>
          
          <div className="flex-1 px-8 pb-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Generating your personalized insights...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                variant="outline" 
                className="bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 text-sm transition-all duration-300 hover:scale-105"
                onClick={fetchInsights}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'} <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200" />
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
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
