import React from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import ChatSidebar from '@/components/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Home, 
  User, 
  Heart, 
  Repeat, 
  FileWarning, 
  Lightbulb, 
  ArrowRightLeft, 
  Brain, 
  Users, 
  HandHeart, 
  Wallet, 
  Shield
} from 'lucide-react';
import { usePersonalizedStory } from '@/hooks/usePersonalizedStory';
import { PersonalizationBadge } from '@/components/PersonalizationBadge';
import { useIsMobile } from '@/hooks/use-mobile';

// Map milestone titles/content to appropriate icons
const getMilestoneIcon = (milestone: { title: string; content: string }, index: number) => {
  // Lowercase for easier matching
  const title = milestone.title.toLowerCase();
  const content = milestone.content.toLowerCase();

  // Map based on common themes in milestone content
  if (title.includes('origin') || content.includes('origin') || content.includes('family')) {
    return <Home size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('identity') || content.includes('identity')) {
    return <User size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('feelings') || content.includes('feeling') || content.includes('relief')) {
    return <Heart size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('cycle') || content.includes('cycle') || content.includes('overspend')) {
    return <Repeat size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('stress') || content.includes('stress') || content.includes('dread')) {
    return <FileWarning size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('guidance') || content.includes('guidance') || content.includes('honest')) {
    return <Lightbulb size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('shift') || content.includes('shift') || content.includes('worth')) {
    return <ArrowRightLeft size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('mind') || content.includes('mind') || content.includes('anxious')) {
    return <Brain size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('traps') || content.includes('trap') || content.includes('free')) {
    return <Sparkles size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('connections') || content.includes('connect') || content.includes('friendship')) {
    return <Users size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('gratitude') || content.includes('gratitude') || content.includes('abundance')) {
    return <HandHeart size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('practices') || content.includes('spending') || content.includes('money')) {
    return <Wallet size={20} strokeWidth={1} className="text-white/70" />;
  } else if (title.includes('security') || content.includes('security') || content.includes('savings')) {
    return <Shield size={20} strokeWidth={1} className="text-white/70" />;
  }
  
  // Fallback icon based on index position to ensure variety
  const fallbackIcons = [
    <Home size={20} strokeWidth={1} className="text-white/70" />,
    <User size={20} strokeWidth={1} className="text-white/70" />,
    <Heart size={20} strokeWidth={1} className="text-white/70" />,
    <Repeat size={20} strokeWidth={1} className="text-white/70" />,
    <FileWarning size={20} strokeWidth={1} className="text-white/70" />,
    <Lightbulb size={20} strokeWidth={1} className="text-white/70" />,
    <ArrowRightLeft size={20} strokeWidth={1} className="text-white/70" />,
    <Brain size={20} strokeWidth={1} className="text-white/70" />,
    <Sparkles size={20} strokeWidth={1} className="text-white/70" />,
    <Users size={20} strokeWidth={1} className="text-white/70" />,
    <HandHeart size={20} strokeWidth={1} className="text-white/70" />,
    <Wallet size={20} strokeWidth={1} className="text-white/70" />,
    <Shield size={20} strokeWidth={1} className="text-white/70" />
  ];
  
  return fallbackIcons[index % fallbackIcons.length];
};

// Generate organic tree trunk path with equal spacing between milestones
const generateTrunkPath = (milestones: any[], containerHeight: number) => {
  const startY = 60;
  const endY = containerHeight - 100;
  const centerX = 0; // Will be positioned at 50% with transform
  
  // Calculate equal spacing between milestones
  const totalSpacing = endY - startY;
  const spacingBetween = milestones.length > 1 ? totalSpacing / (milestones.length - 1) : 0;
  
  // Calculate positions with equal spacing
  const positions = milestones.map((_, index) => {
    const y = startY + (index * spacingBetween);
    // Add subtle horizontal curve - alternating gentle S-curve
    const curveAmplitude = 8;
    const progress = index / Math.max(1, milestones.length - 1);
    const x = Math.sin(progress * Math.PI * 2) * curveAmplitude;
    return { x, y };
  });
  
  // Create smooth curved path through all positions
  let pathData = `M ${centerX} ${startY}`;
  
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const nextPos = positions[i + 1];
    
    if (i === 0) {
      // First curve
      const controlY = pos.y + (nextPos ? (nextPos.y - pos.y) * 0.3 : 0);
      pathData += ` Q ${pos.x} ${controlY} ${pos.x} ${pos.y}`;
    } else if (nextPos) {
      // Smooth curve to next position
      const controlY = pos.y + (nextPos.y - pos.y) * 0.3;
      pathData += ` Q ${pos.x} ${controlY} ${nextPos.x} ${nextPos.y}`;
    }
  }
  
  return { pathData, positions };
};

// Generate curved branch path from trunk to card
const generateBranchPath = (trunkPos: { x: number; y: number }, isLeft: boolean, index: number) => {
  const direction = isLeft ? -1 : 1;
  const branchLength = 40 + (index % 3) * 8; // Varying branch lengths
  const endX = trunkPos.x + direction * branchLength;
  const midX = trunkPos.x + direction * (branchLength * 0.6);
  const midY = trunkPos.y - 5; // Slight upward curve
  
  return `M ${trunkPos.x} ${trunkPos.y} Q ${midX} ${midY} ${endX} ${trunkPos.y}`;
};

const MoneyTreePage = () => {
  const isMobile = useIsMobile();
  const {
    milestones,
    isLoading,
    isGenerating,
    isExpired,
    error,
    shouldRefresh,
    regenerate,
    dataSources
  } = usePersonalizedStory();

  // Generate tree structure with consistent spacing
  const baseSpacing = 140; // Fixed spacing between milestones
  const containerHeight = milestones.length * baseSpacing + 200;
  const { pathData, positions } = generateTrunkPath(milestones, containerHeight);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Desktop Sidebar */}
      {!isMobile && <ChatSidebar />}
      
      <div className="flex-1 relative">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="https://raw.githubusercontent.com/saltnpepper12/videos/main/money-tree-12.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative h-full flex flex-col z-10">
          {/* Sticky Header - Same as ChatPage */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            <ChatHeader />
            <div className="h-[1px] bg-white/10"></div>
          </div>

          {/* 8px Spacer */}
          <div className="h-2 flex-shrink-0"></div>

          {/* Main Content - Scrollable Area */}
          <div className="flex-1 relative z-20 min-h-0">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-black/20 p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white mx-auto mb-4" />
                  <p className="text-white font-medium text-lg drop-shadow-lg font-dm-sans">
                    {isGenerating ? 'Creating your personalized story...' : 'Loading your story...'}
                  </p>
                  <p className="text-white/70 text-sm mt-2 font-dm-sans">
                    Analyzing your journey and insights
                  </p>
                </div>
              </div>
            )}

            {/* Story Content */}
            {!isLoading && milestones.length > 0 && (
              <ScrollArea className="h-full">
                <div className="px-4">
                  <div className="relative mx-auto max-w-2xl py-4" style={{ minHeight: `${containerHeight}px` }}>
                    {/* Organic Tree Trunk - SVG with curved path */}
                    <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-full h-full pointer-events-none">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={`-50 0 100 ${containerHeight}`}
                        className="absolute inset-0"
                      >
                        {/* Tree trunk shadow for depth */}
                        <path
                          d={pathData}
                          stroke="rgba(85, 107, 47, 0.3)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          transform="translate(2, 2)"
                          className="drop-shadow-lg"
                        />
                        
                        {/* Main tree trunk with organic curve */}
                        <path
                          d={pathData}
                          stroke="url(#trunkGradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          className="animate-pulse"
                          style={{ animationDuration: '4s' }}
                        />
                        
                        {/* Gradient definition for trunk */}
                        <defs>
                          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(85, 107, 47, 0.8)" />
                            <stop offset="50%" stopColor="rgba(74, 95, 41, 0.9)" />
                            <stop offset="100%" stopColor="rgba(85, 107, 47, 0.6)" />
                          </linearGradient>
                          
                          <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(85, 107, 47, 0.7)" />
                            <stop offset="100%" stopColor="rgba(74, 95, 41, 0.4)" />
                          </linearGradient>
                        </defs>
                        
                        {/* Branch lines for each milestone */}
                        {positions.map((pos, index) => {
                          const isLeft = index % 2 === 0;
                          const branchPath = generateBranchPath(pos, isLeft, index);
                          
                          return (
                            <g key={`branch-${index}`}>
                              {/* Branch shadow */}
                              <path
                                d={branchPath}
                                stroke="rgba(85, 107, 47, 0.2)"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                transform="translate(1, 1)"
                              />
                              
                              {/* Main branch */}
                              <path
                                d={branchPath}
                                stroke="url(#branchGradient)"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                className="animate-fade-in"
                                style={{ 
                                  animationDelay: `${index * 0.2}s`,
                                  animationDuration: '0.8s',
                                  animationFillMode: 'both'
                                }}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    
                    {/* Milestones with absolute positioning for equal spacing */}
                    <div className="relative">
                      {milestones.map((milestone, index) => {
                        const pos = positions[index];
                        const isLeft = index % 2 === 0;
                        
                        return (
                          <div 
                            key={milestone.id} 
                            className="absolute w-full flex items-center"
                            style={{ 
                              top: `${pos.y - 40}px`, // Center the card on the position
                              minHeight: '80px'
                            }}
                          >
                            {/* Enhanced Milestone Node */}
                            <div 
                              className="absolute left-1/2 transform -translate-x-1/2 z-20"
                              style={{ transform: `translateX(calc(-50% + ${pos.x}px))` }}
                            >
                              {/* Node glow effect */}
                              <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#556B2F]/60 to-[#4a5f29]/40 blur-sm animate-pulse" style={{ animationDuration: `${2 + index * 0.3}s` }}></div>
                              
                              {/* Main node */}
                              <div className="relative w-6 h-6 bg-gradient-to-br from-[#556B2F]/90 to-[#4a5f29]/80 rounded-full border-3 border-white/70 shadow-lg backdrop-blur-sm transform transition-all duration-300 hover:scale-110">
                                {/* Inner glow */}
                                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                              </div>
                            </div>
                            
                            {/* Milestone Card - Enhanced positioning */}
                            <div className={`z-30 ${
                              isLeft 
                                ? 'ml-auto mr-0 w-[calc(50%-50px)] sm:mr-8 sm:w-full sm:max-w-[420px] text-right' 
                                : 'ml-0 mr-auto w-[calc(50%-50px)] sm:ml-8 sm:w-full sm:max-w-[420px] text-left'
                            }`}>
                              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-lg border border-white/10 hover:transition-all duration-300 hover:bg-white/25 hover:scale-[1.02] transform">
                                <div className="flex items-stretch gap-3">
                                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-white/20">
                                    {getMilestoneIcon(milestone, index)}
                                  </span>
                                  <div className="flex-1">
                                    <h3 className="text-white/95 text-[11px] font-medium leading-tight tracking-wide font-dm-sans sm:text-base mb-0.5 text-left">
                                      {milestone.title}
                                    </h3>
                                    <p className="text-white/70 text-[9px] sm:text-xs font-light leading-tight tracking-wide font-dm-sans text-left">
                                      {milestone.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Extra space at bottom */}
                    <div className="h-32"></div>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* Empty State */}
            {!isLoading && milestones.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-black/20 p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <AlertCircle size={48} className="text-white/50 mx-auto mb-4" />
                  <p className="text-white font-medium text-lg drop-shadow-lg mb-2 font-dm-sans">
                    Story Unavailable
                  </p>
                  <p className="text-white/70 text-sm mb-4 font-dm-sans">
                    We couldn't load your money origin story right now.
                  </p>
                  <Button onClick={regenerate} disabled={isGenerating} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-dm-sans">
                    <RefreshCw size={14} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile/Tablet Bottom Navigation */}
        {isMobile && <BottomNavigation />}
      </div>
    </div>
  );
};

export default MoneyTreePage;
