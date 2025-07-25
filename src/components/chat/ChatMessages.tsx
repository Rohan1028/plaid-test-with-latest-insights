
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from '@/components/chat/ChatMessage';
import ConsentRequestCard from '@/components/chat/ConsentRequestCard';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sessionId?: string;
  isConsentRequest?: boolean;
  interventionPreview?: any;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isAwaitingConsent: boolean;
  onConsentResponse: (isYes: boolean) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  isAwaitingConsent,
  onConsentResponse
}) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Check if we only have the initial welcome message
  const isInitialState = messages.length === 1 && 
    (messages[0].id === 'welcome' || messages[0].id.startsWith('session-greeting'));

  return (
    <div className="flex-1 flex justify-center overflow-hidden px-6">
      <div className="w-full max-w-2xl">
        <ScrollArea className="h-full">
          <div className="space-y-4 pb-48 pt-6">
            {messages && messages.length > 0 ? (
              messages.map(message => (
                <div key={message.id} className="animate-fade-in">
                  <ChatMessage message={message} />
                  
                  {message.isConsentRequest && message.interventionPreview && (
                    <div className="mt-6">
                      <ConsentRequestCard 
                        interventionPreview={message.interventionPreview} 
                        onConsentResponse={onConsentResponse} 
                        isLoading={isLoading} 
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-white/60 mt-12">
                <p className="font-dm-sans">Start a conversation about your money journey...</p>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatMessages;
