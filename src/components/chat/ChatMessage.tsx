
import React, { useMemo } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sessionId?: string;
  isConsentRequest?: boolean;
  interventionPreview?: any;
}

interface ChatMessageProps {
  message: Message;
}

// Global timezone formatter to avoid repeated timezone lookups
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC' // Use UTC consistently to avoid expensive timezone operations
});

const ChatMessage: React.FC<ChatMessageProps> = ({
  message
}) => {
  // Cache formatted timestamp to avoid repeated timezone operations
  const formattedTimestamp = useMemo(() => {
    try {
      return timeFormatter.format(message.timestamp);
    } catch (error) {
      // Fallback to simple formatting if timezone operations fail
      const hours = message.timestamp.getHours().toString().padStart(2, '0');
      const minutes = message.timestamp.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }, [message.timestamp]);

  // Glassmorphic styling for chat bubbles with #135261 tint for user messages
  const messageBubbleClass = message.role === 'user' 
    ? "px-4 py-3 bg-[#135261]/30 backdrop-blur-md border border-[#135261]/15 text-white relative rounded-2xl rounded-br-md shadow-lg"
    : "px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 text-white relative rounded-2xl rounded-bl-md shadow-lg";

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`w-full ${message.role === 'user' ? 'flex justify-end' : ''}`}>
        <div className={messageBubbleClass}>
          {/* Avatar always positioned on the left side */}
          <div className="absolute top-3 left-4">
            <Avatar className="h-6 w-6 flex-shrink-0">
              {message.role === 'assistant' ? (
                <AvatarFallback className="bg-teal-500 border-0 font-normal text-white p-0 overflow-hidden">
                  <img 
                    src="/lovable-uploads/5bccb031-ee60-4a74-af7a-d752ba7e9370.png" 
                    alt="Assistant logo" 
                    className="w-full h-full object-cover"
                  />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="text-white border-0 font-normal text-xs" style={{ backgroundColor: '#648936' }}>
                  U
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          {/* Message content with left padding to accommodate the avatar */}
          <div className="pl-10">
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal font-dm-sans">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
