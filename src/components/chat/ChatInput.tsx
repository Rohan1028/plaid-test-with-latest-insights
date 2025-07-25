
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isAwaitingConsent: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSendMessage,
  isLoading,
  isAwaitingConsent
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAwaitingConsent && !isLoading && input.trim()) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    if (!isAwaitingConsent && !isLoading && input.trim()) {
      onSendMessage();
    }
  };

  return (
    <div className="flex justify-center px-6 mb-6">
      <div className="w-full max-w-2xl">
        <div className="relative">
          <Input
            type="text"
            placeholder={isAwaitingConsent ? "Please respond to the reflection offer above..." : "What are you thinking?"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isAwaitingConsent}
            style={{
              outline: 'none',
              boxShadow: 'none'
            }}
            className="w-full border border-white/[0.17] text-white placeholder:text-gray-400 font-dm-sans font-normal text-sm py-4 px-5 pr-14 focus:outline-none focus:ring-0 focus:border-white/[0.17] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !outline-none !ring-0 !ring-offset-0 transition-all duration-200 h-12 shadow-sm hover:border-white/[0.17] bg-[A9A9A9] rounded-lg bg-[#a9a9a9]/[0.25]"
          />
          <Button
            onClick={handleSendClick}
            disabled={isLoading || !input.trim() || isAwaitingConsent}
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white border-0 rounded-full w-8 h-8 p-0 font-medium shadow-none transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-40 disabled:bg-gray-400"
            style={{ 
              backgroundColor: '#F57820'
            }}
          >
            {isLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        
        {isAwaitingConsent && (
          <p className="text-sm text-gray-400 font-dm-sans font-normal mt-3 text-center">
            Please respond to the reflection exercise offer above using the buttons.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
