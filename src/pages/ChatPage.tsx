
import React from 'react';
import MoneyCoachChat from '@/components/MoneyCoachChat';
import ChatSidebar from '@/components/ChatSidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const ChatPage = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Desktop Sidebar */}
      {!isMobile && <ChatSidebar />}
      
      <div className="flex-1 relative">
        {/* Background image for chat area only */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{
            backgroundImage: 'url(/lovable-uploads/664ad156-6d2f-4de5-a898-8d5166fc2d88.png)'
          }} 
        />
        
        {/* Chat component with mobile padding */}
        <div className={`relative z-10 ${isMobile ? 'pb-20' : ''}`}>
          <MoneyCoachChat />
        </div>
        
        {/* Disclaimer positioned exactly 2px from the very bottom on desktop, adjusted for mobile */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 z-20" 
          style={{ bottom: isMobile ? '82px' : '2px' }}
        >
          <p className="text-center text-[10px] font-light text-white/[0.54] whitespace-nowrap">
            Money Coach is experimental and may make mistakes.
          </p>
        </div>
      </div>

      {/* Mobile/Tablet Bottom Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default ChatPage;
