
import React from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Leaf } from 'lucide-react';

const InsightsPage = () => {
  const insights = [
    {
      id: 1,
      type: 'spending-image',
      title: "You've been spending (~$330 more on retail) since your sleep dropped and you mentioned a breakup.",
      bgImage: true,
      bgColor: 'bg-gradient-to-br from-amber-200 to-orange-300',
      span: 'col-span-2 row-span-2'
    },
    {
      id: 2,
      type: 'feeling-check',
      title: 'Feeling off lately?',
      subtitle: "You haven't said much, but your recent chat hints at a breakup.",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 3,
      type: 'spending-notice',
      title: "Spending's up by ~$300 especially on comfort retail buys.",
      subtitle: "That's okay.",
      bgColor: 'bg-gray-800',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 4,
      type: 'emotional-weight',
      title: 'Emotional weight, rest →',
      subtitle: "It's a lot.",
      bgColor: 'bg-gray-700',
      isPartial: true,
      span: 'col-span-1 row-span-1'
    }
  ];

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
              >
                Today <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-200" />
              </Button>
            </div>
          </div>
          
        </div>

        {/* Insights Grid */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          <div className="grid grid-cols-3 grid-rows-3 gap-6 h-full max-h-[600px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {insights.map((insight, index) => (
              <Card
                key={insight.id}
                className={`${insight.bgColor} border-0 hover:scale-[1.03] transition-all duration-500 cursor-pointer relative overflow-hidden ${insight.span} group`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fade-in 0.8s ease-out forwards'
                }}
              >
                <CardContent className="p-6 h-full flex flex-col justify-between relative">
                  {/* Background effects */}
                  {insight.bgImage && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-300/30 rounded-lg"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-lg"></div>
                    </>
                  )}
                  
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                  
                  <div className="relative z-10 flex-1 flex flex-col justify-center">
                    <h3 className={`font-medium mb-3 text-white leading-relaxed transition-all duration-300 group-hover:transform group-hover:translate-y-[-2px] ${
                      insight.span.includes('col-span-2') ? 'text-xl' : 'text-lg'
                    }`}>
                      {insight.title}
                    </h3>
                    
                    {insight.subtitle && (
                      <p className={`text-white/70 leading-relaxed transition-all duration-300 group-hover:text-white/90 ${
                        insight.span.includes('col-span-2') ? 'text-base' : 'text-sm'
                      }`}>
                        {insight.subtitle}
                      </p>
                    )}
                  </div>

                  {insight.isPartial && (
                    <div className="absolute top-4 right-4">
                      <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {/* Floating animation for the main card */}
                  {insight.span.includes('col-span-2') && (
                    <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                      <div className="w-8 h-8 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                    </div>
                  )}
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
