
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex flex-col h-screen relative ${isMobile ? 'pb-20' : ''}`}>
      {children}
    </div>
  );
};

export default ChatLayout;
