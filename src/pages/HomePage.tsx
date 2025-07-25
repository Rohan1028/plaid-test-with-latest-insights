
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { Heart, Target, TrendingUp, DollarSign, Compass } from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning!';
    } else if (hour < 18) {
      return 'Good afternoon!';
    } else {
      return 'Good evening!';
    }
  };

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());

    // Update greeting every minute to keep it current
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChatWithIncluya = () => {
    navigate('/chat');
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
        <video autoPlay loop muted playsInline preload="auto" className="absolute w-full h-full object-cover">
          <source src="https://raw.githubusercontent.com/saltnpepper12/videos/main/Home%20page.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen overflow-y-auto">
        {/* Refined Header */}
        <div className="pt-6 pb-4 text-center relative">
          <h1 className="relative font-display text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-[0.15em] animate-fade-in drop-shadow-2xl">
            <span className="text-white drop-shadow-xl">
              INCLUYA
            </span>
            {/* Glowing underline */}
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-teal-300/80 to-transparent mx-auto mt-2 animate-shimmer shadow-lg shadow-teal-300/50"></div>
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-4 pb-24 space-y-6">
          {/* Greeting Section */}
          <div className="text-center space-y-5 animate-fade-in">
            {/* Professional Text Section */}
            <div className="space-y-3 relative max-w-md mx-auto">
              {/* Refined floating elements */}
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-teal-300/60 rounded-full animate-float"></div>
              <div className="absolute -top-2 right-2 w-1 h-1 bg-blue-300/50 rounded-full animate-float" style={{
                animationDelay: '1s'
              }}></div>
              <div className="absolute -bottom-1 -right-0.5 w-1.5 h-1.5 bg-white/30 rounded-full animate-float" style={{
                animationDelay: '2s'
              }}></div>
              
              {/* Greeting */}
              <div className="relative">
                <h2 className="text-white text-lg md:text-xl lg:text-2xl font-display font-medium mb-1 drop-shadow-2xl">
                  {greeting}
                </h2>
              </div>
            </div>
          </div>

          {/* Big-Picture Money Insights Section */}
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Big-Picture Money Insights Card */}
            <Card className="bg-black/60 backdrop-blur-xl border-2 border-white/50 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-display font-medium text-lg flex items-center gap-2 drop-shadow-xl">
                  <Compass size={20} className="text-teal-300" />
                  Big-Picture Money Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Childhood Money Story */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/30">
                  <div className="flex items-start gap-3">
                    <Heart size={16} className="text-pink-300 mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-white text-sm font-medium drop-shadow-xl">Childhood Money Story</p>
                      <p className="text-white/80 text-xs leading-relaxed">
                        "Only spend once everything's paid"—wise words, but don't let them trigger a reward splurge.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emotional Pattern */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/30">
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} className="text-blue-300 mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-white text-sm font-medium drop-shadow-xl">Emotional Pattern</p>
                      <p className="text-white/80 text-xs leading-relaxed">
                        Paying bills brings relief—just don't let it open the door to overspending "treats."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Aspirations */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/30">
                  <div className="flex items-start gap-3">
                    <Target size={16} className="text-yellow-300 mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-white text-sm font-medium drop-shadow-xl">Financial Aspirations</p>
                      <p className="text-white/80 text-xs leading-relaxed">
                        Stress-free travel starts with a three-month cushion for rent and bills.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Step */}
                <div className="flex items-center gap-2 bg-teal-900/30 rounded-lg p-4 border border-teal-400/30">
                  <DollarSign size={16} className="text-teal-300" />
                  <div>
                    <p className="text-teal-200 text-sm font-medium mb-1">Next Step</p>
                    <p className="text-teal-200/90 text-xs leading-relaxed">
                      Set it and forget it: $20/week to your "Travel Cushion" puts freedom on the calendar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Insights Card */}
            <Card className="bg-black/60 backdrop-blur-xl border-2 border-white/50 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-display font-medium text-lg flex items-center gap-2 drop-shadow-xl">
                  <TrendingUp size={20} className="text-teal-300" />
                  Your Spending Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-black/40 rounded-lg p-3 border border-white/30">
                    <div className="flex items-start gap-3">
                      <TrendingUp size={16} className="text-green-300 mt-1 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-white text-sm font-medium mb-1 drop-shadow-xl">Spending Pattern</p>
                        <p className="text-white/80 text-xs leading-relaxed">
                          Everyday life stays modest—coffee, quick bites, and occasional Uber rides.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg p-3 border border-white/30">
                    <p className="text-white text-sm font-medium mb-1 drop-shadow-xl">Key Insight</p>
                    <p className="text-white/80 text-xs leading-relaxed">
                      After big expenses, you naturally treat yourself. Consider planning lower-cost rewards to maintain balance.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-teal-900/30 rounded-lg p-3 border border-teal-400/30">
                    <DollarSign size={16} className="text-teal-300" />
                    <p className="text-teal-200 text-xs font-medium">
                      Smart tip: Plan treats ahead to avoid budget surprises
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Chat Card */}
          <div className="max-w-xs mx-auto">
            <div className="relative group">
              {/* Subtle glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/15 via-teal-400/15 to-blue-400/15 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              
              {/* Main card */}
              <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border-2 border-white/50 hover:bg-black/70 transition-all duration-500 ease-out transform hover:scale-105">
                <div className="relative space-y-3">
                  <div className="space-y-2">
                    <p className="text-white text-sm md:text-base font-display font-medium leading-relaxed drop-shadow-xl">
                      Would you like to check-in with Incluya about your financial mindset today?
                    </p>
                  </div>
                  
                  <Button onClick={handleChatWithIncluya} className="w-full bg-white hover:bg-gray-100 text-black font-display font-medium py-3 px-5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-102 border-0 text-sm md:text-base drop-shadow-xl">
                    <span className="flex items-center justify-center gap-2">
                      Chat with Incluya
                      <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-pulse"></div>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default HomePage;
