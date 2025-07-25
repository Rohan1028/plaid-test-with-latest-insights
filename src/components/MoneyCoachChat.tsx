/**
 * MoneyCoachChat - AI-powered Money Coaching Chat Interface
 * 
 * Main chat component for conversational money coaching with AI assistant.
 * Handles intervention triggers, consent management, and session isolation.
 */

import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import InterventionModal from '@/components/InterventionModal';
import ChatLayout from '@/components/chat/ChatLayout';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { useMoneyCoachChat } from '@/hooks/useMoneyCoachChat';
import { generateSessionId } from '@/lib/utils';
const MoneyCoachChat = () => {
  const [input, setInput] = useState('');
  const [interventionModal, setInterventionModal] = useState<{
    isOpen: boolean;
    intervention: any | null;
  }>({
    isOpen: false,
    intervention: null
  });
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();

  // Add console logging to debug the auth state
  console.log('MoneyCoachChat - User state:', user);
  console.log('MoneyCoachChat - Component mounted');
  const {
    messages,
    isLoading,
    isLoadingHistory,
    currentSessionId,
    setCurrentSessionId,
    isAwaitingConsent,
    setIsAwaitingConsent,
    sendMessage,
    handleConsentResponse,
    addAssistantMessage
  } = useMoneyCoachChat();
  console.log('MoneyCoachChat - Messages:', messages);
  console.log('MoneyCoachChat - isLoadingHistory:', isLoadingHistory);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    console.log('Sending message:', userMessage);
    try {
      const data = await sendMessage(userMessage);
      if (data) {
        if (data.session_info?.session_id) {
          setCurrentSessionId(data.session_info.session_id);
        }
        if (data.intervention) {
          console.log('Intervention triggered:', data.intervention);
          setInterventionModal({
            isOpen: true,
            intervention: data.intervention
          });
          await addAssistantMessage(`I think this would be a good time for a guided reflection. I'd like to invite you to explore "${data.intervention.name}" - ${data.intervention.description}`, {
            sessionId: currentSessionId || data.session_info?.session_id
          });
        } else if (data.consent_request) {
          console.log('Consent request received:', data.intervention_preview);
          await addAssistantMessage(data.message, {
            sessionId: currentSessionId || data.session_info?.session_id,
            isConsentRequest: true,
            interventionPreview: data.intervention_preview
          });
          setIsAwaitingConsent(true);
        } else if (data.awaiting_consent) {
          console.log('Still awaiting consent response');
          await addAssistantMessage(data.message, {
            sessionId: currentSessionId || data.session_info?.session_id,
            isConsentRequest: true,
            interventionPreview: data.pending_intervention
          });
          setIsAwaitingConsent(true);
        } else if (data.message) {
          await addAssistantMessage(data.message, {
            sessionId: currentSessionId || data.session_info?.session_id
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  const handleConsentClick = async (isYes: boolean) => {
    setIsAwaitingConsent(false);
    try {
      const data = await handleConsentResponse(isYes);
      if (data) {
        if (data.session_info?.session_id) {
          setCurrentSessionId(data.session_info.session_id);
        }
        if (data.intervention) {
          setInterventionModal({
            isOpen: true,
            intervention: data.intervention
          });
          await addAssistantMessage(`Great! Let's explore "${data.intervention.name}" together. This will help you ${data.intervention.description.toLowerCase()}`, {
            sessionId: currentSessionId || data.session_info?.session_id
          });
        }
      }
    } catch (error) {
      console.error('Error handling consent response:', error);
    }
  };
  const handleInterventionComplete = async () => {
    // Create a new session ID to ensure fresh context after intervention
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    try {
      await addAssistantMessage("Welcome back! How are you feeling after that reflection? I'm here to continue supporting you on your money journey.", {
        sessionId: newSessionId
      });
    } catch (error) {
      console.error('Error adding completion message:', error);
    }
    setInterventionModal({
      isOpen: false,
      intervention: null
    });
  };
  const handleInterventionModalClose = () => {
    // Generate new session ID when intervention is closed without completion
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    setInterventionModal({
      isOpen: false,
      intervention: null
    });
  };
  if (!user) {
    return <ChatLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white mx-auto mb-4" />
            <p className="text-white font-medium text-lg">Loading...</p>
          </div>
        </div>
      </ChatLayout>;
  }
  if (isLoadingHistory) {
    return <ChatLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white mx-auto mb-4" />
            <p className="text-white font-medium text-lg">Loading your conversation...</p>
          </div>
        </div>
      </ChatLayout>;
  }
  return <ChatLayout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-30">
        <div className="pt-2 pb-1.5 flex justify-between items-center px-[16px]">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/dc796d96-cbad-4610-b735-c58ee884fec4.png" alt="Logo" className="w-6 h-6 md:hidden" />
            <span className="text-white font-dm-sans font-light tracking-wide text-lg">Talk.</span>
          </div>
          <button onClick={handleSignOut} className="md:hidden text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
        <div className="h-[1px] bg-white/10"></div>
      </div>
      
      <ChatMessages messages={messages} isLoading={isLoading} isAwaitingConsent={isAwaitingConsent} onConsentResponse={handleConsentClick} />

      {/* Input Area */}
      <div className="flex-shrink-0">
        <ChatInput input={input} setInput={setInput} onSendMessage={handleSendMessage} isLoading={isLoading} isAwaitingConsent={isAwaitingConsent} />
      </div>

      <InterventionModal intervention={interventionModal.intervention} isOpen={interventionModal.isOpen} onClose={handleInterventionModalClose} onComplete={handleInterventionComplete} />
    </ChatLayout>;
};
export default MoneyCoachChat;