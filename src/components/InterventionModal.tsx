import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageCircle, X, AlertTriangle, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InterventionFeedback from './InterventionFeedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
interface InterventionModalProps {
  intervention: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Global timezone formatter to avoid repeated timezone lookups - same as ChatMessage
const interventionTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC' // Use UTC consistently to avoid expensive timezone operations
});
const InterventionModal: React.FC<InterventionModalProps> = ({
  intervention,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{
    type: 'system' | 'user';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  // Add scroll ref for auto-scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Complete state reset function to prevent state pollution between interventions
  const resetAllState = () => {
    setCurrentResponse('');
    setIsLoading(false);
    setSessionData(null);
    setMessages([]);
    setIsComplete(false);
    setShowFeedback(false);
    setShowExitConfirmation(false);
    setExitReason('');
    setIsExiting(false);
    setProgressValue(0);
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      resetAllState();
    }
  }, [isOpen]);

  // Reset state when intervention changes (new intervention starting)
  React.useEffect(() => {
    if (isOpen && intervention?.id) {
      resetAllState();
    }
  }, [intervention?.id, isOpen]);

  // Progress bar animation effect - smooth fill to 100% without looping
  useEffect(() => {
    if (isLoading && !sessionData) {
      const interval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100; // Stay at 100% instead of resetting
          }
          return prev + 2; // Slightly faster increment for smoother animation
        });
      }, 30); // Slightly slower interval for smoother animation (1.5 seconds total)

      return () => clearInterval(interval);
    } else {
      setProgressValue(0);
    }
  }, [isLoading, sessionData]);

  // Optimize timestamp formatting for all messages at once
  const formattedMessages = useMemo(() => {
    return messages.map((message, index) => ({
      ...message,
      id: `msg-${index}`,
      formattedTime: (() => {
        try {
          return interventionTimeFormatter.format(message.timestamp);
        } catch (error) {
          // Fallback to simple formatting if timezone operations fail
          const hours = message.timestamp.getHours().toString().padStart(2, '0');
          const minutes = message.timestamp.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      })()
    }));
  }, [messages]);
  const startIntervention = async () => {
    setIsLoading(true);
    try {
      console.log('Starting intervention:', intervention.id);
      const {
        data,
        error
      } = await supabase.functions.invoke('intervention-guidance', {
        body: {
          action: 'start',
          intervention_id: intervention.id
        }
      });
      if (error) {
        console.error('Error starting intervention:', error);
        toast.error('Failed to start intervention');
        return;
      }
      console.log('Intervention started:', data);
      setSessionData({
        progress_id: data.progress_id,
        intervention_name: data.intervention_name,
        current_question_index: data.current_question_index,
        total_questions: data.total_questions,
        current_milestone: {
          milestone_name: `Question ${data.current_question_index + 1} of ${data.total_questions}`
        }
      });
      setMessages([{
        type: 'system',
        content: data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting intervention:', error);
      toast.error('Failed to start intervention');
    } finally {
      setIsLoading(false);
    }
  };
  const submitResponse = async () => {
    if (!currentResponse.trim() || !sessionData) return;
    setIsLoading(true);
    const userMessage = currentResponse.trim();

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    setCurrentResponse('');
    try {
      console.log('Submitting response for progress:', sessionData.progress_id);
      const {
        data,
        error
      } = await supabase.functions.invoke('intervention-guidance', {
        body: {
          action: 'respond',
          progress_id: sessionData.progress_id,
          user_response: userMessage
        }
      });
      if (error) {
        console.error('Error submitting response:', error);
        toast.error('Failed to process response');
        return;
      }
      console.log('Response processed:', data);

      // Add system response
      setMessages(prev => [...prev, {
        type: 'system',
        content: data.message,
        timestamp: new Date()
      }]);
      if (data.is_complete) {
        setIsComplete(true);
        setShowFeedback(true);
        toast.success('Intervention completed!');
      } else {
        // Update session data with new progress
        setSessionData(prev => ({
          ...prev,
          current_question_index: data.current_question_index,
          current_milestone: {
            milestone_name: `Question ${data.current_question_index} of ${data.total_questions}`
          }
        }));
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to process response');
    } finally {
      setIsLoading(false);
    }
  };
  const handleEarlyExit = () => {
    setShowExitConfirmation(true);
  };
  const confirmEarlyExit = async () => {
    if (!sessionData?.progress_id) {
      console.error('No progress ID available for exit');
      toast.error('Unable to save exit status - no session found');
      resetAllState(); // Reset state before calling onClose
      onClose();
      return;
    }
    setIsExiting(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        toast.error('User authentication required');
        setIsExiting(false);
        return;
      }
      console.log('Recording early exit for progress:', sessionData.progress_id, 'user:', user.id);

      // Update progress record with early exit
      const {
        data,
        error
      } = await supabase.from('user_intervention_progress').update({
        status: 'exited',
        completion_type: 'early_exit',
        exit_reason: exitReason.trim() || 'User chose to exit early',
        exited_at: new Date().toISOString()
      }).eq('id', sessionData.progress_id).eq('user_id', user.id).select();
      if (error) {
        console.error('Error recording early exit:', error);
        toast.error(`Failed to save exit status: ${error.message}`);
        setIsExiting(false);
        return;
      }
      console.log('Early exit recorded successfully:', data);
      toast.success('Your progress has been saved');
      resetAllState(); // Reset state before calling onClose
      onClose();
    } catch (error) {
      console.error('Error handling early exit:', error);
      toast.error('Failed to process exit');
      setIsExiting(false);
    }
  };
  const handleFeedbackComplete = async () => {
    try {
      // Call the intervention completion function to properly close the intervention
      const {
        data,
        error
      } = await supabase.functions.invoke('intervention-completion', {
        body: {
          intervention_id: intervention.id
        }
      });
      if (error) {
        console.error('Error calling intervention completion:', error);

        // Check if error is because intervention was already completed
        if (error.message?.includes('No active intervention found') || error.message?.includes('already completed')) {
          console.log('Intervention was already completed - this is normal');
          // Don't show error to user for this case
        } else {
          toast.error('Failed to complete intervention properly');
        }
      } else {
        console.log('Intervention completion called successfully');
        if (data?.success) {
          console.log('Intervention completion confirmed:', data.message);
        }
      }
    } catch (completionError) {
      console.error('Error updating completion status:', completionError);
      toast.error('Failed to update completion status');
    }
    resetAllState(); // Reset state before calling onComplete
    onComplete();
  };
  const handleClose = () => {
    if (isComplete && !showFeedback) {
      resetAllState(); // Reset state before calling onComplete
      onComplete();
    } else if (!isComplete && sessionData) {
      handleEarlyExit();
      return;
    }
    resetAllState(); // Reset state before calling onClose
    onClose();
  };

  // Only start intervention when modal opens AND we don't have session data yet
  React.useEffect(() => {
    if (isOpen && intervention && !sessionData && !isComplete) {
      startIntervention();
    }
  }, [isOpen, intervention?.id]);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && currentResponse.trim()) {
      e.preventDefault();
      submitResponse();
    }
  };

  // Show feedback modal
  if (showFeedback && sessionData) {
    return <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0">
          <div className="relative overflow-hidden rounded-2xl">
            {/* Extended Background Image */}
            <div className="absolute bg-cover bg-center bg-no-repeat z-[-1]" style={{
            backgroundImage: 'url(/lovable-uploads/ce0f3cbe-dd26-40c9-a112-219937720039.png)',
            backgroundSize: 'cover',
            left: '-50vw',
            right: '-50vw',
            top: '-50vh',
            bottom: '-50vh'
          }} />
            
            <div className="relative rounded-2xl p-6">
              <InterventionFeedback interventionId={intervention.id} progressId={sessionData.progress_id} interventionName={intervention.name} onFeedbackComplete={handleFeedbackComplete} />
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }

  // Show exit confirmation modal
  if (showExitConfirmation) {
    return <Dialog open={isOpen} onOpenChange={() => setShowExitConfirmation(false)}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0">
          <div className="relative overflow-hidden rounded-2xl">
            {/* Extended Background Image */}
            <div className="absolute bg-cover bg-center bg-no-repeat z-[-1]" style={{
            backgroundImage: 'url(/lovable-uploads/ce0f3cbe-dd26-40c9-a112-219937720039.png)',
            backgroundSize: 'cover',
            left: '-50vw',
            right: '-50vw',
            top: '-50vh',
            bottom: '-50vh'
          }} />
            
            <div className="relative rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-white text-left font-dm-sans text-2xl">Are you sure you want to exit?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-white/90 text-sm">Don't worry! Your progress will be saved.</p>
                <Textarea value={exitReason} onChange={e => setExitReason(e.target.value)} placeholder="Optional: Let us know why you're exiting (this helps us improve)" className="min-h-[80px] bg-white border-0 text-black placeholder:text-gray-500 rounded-xl" disabled={isExiting} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowExitConfirmation(false)} className="flex-1 bg-white/5 border-0 text-white hover:bg-white/10 rounded-xl focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0" disabled={isExiting}>
                    Continue Session
                  </Button>
                  <Button variant="destructive" onClick={confirmEarlyExit} className="flex-1 bg-red-500/70 hover:bg-red-500/80 border-0 text-white rounded-xl focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0" disabled={isExiting}>
                    {isExiting ? 'Saving...' : 'Exit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] border-0 bg-transparent p-0 rounded-2xl overflow-hidden">
        <div className="relative h-[95vh] flex flex-col rounded-2xl overflow-hidden">
          {/* Extended Background Image */}
          <div className="absolute bg-cover bg-center bg-no-repeat z-[-1]" style={{
          backgroundImage: 'url(/lovable-uploads/ce0f3cbe-dd26-40c9-a112-219937720039.png)',
          backgroundSize: 'cover',
          left: '-50vw',
          right: '-50vw',
          top: '-50vh',
          bottom: '-50vh'
        }} />

          {/* Content Container */}
          <div className="relative h-full flex flex-col">
            {/* Sticky Header - mirroring Chat page layout */}
            <div className="sticky top-0 z-30 flex-shrink-0">
              <div className="pt-2 pb-1.5 flex justify-between items-center px-[16px] text-base font-normal">
                <div className="flex items-center gap-3">
                  <span className="text-white tracking-wide text-base font-normal">Let's Dive Deeper.</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleEarlyExit} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full px-4 border border-white/40 text-xs bg-white/10 backdrop-blur-sm py-1 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0">
                  Exit Session
                </Button>
              </div>
              <div className="h-[1px] bg-white/10"></div>
            </div>

            {/* Messages Area with ScrollArea */}
            <div className="flex-1 flex justify-center overflow-hidden px-6">
              <div className="w-full max-w-2xl">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pb-4 pt-6">
                    {formattedMessages.map((message, index) => <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className={`w-full ${message.type === 'user' ? 'flex justify-end' : ''}`}>
                          <div className={message.type === 'user' ? "px-4 py-3 bg-[#135261]/25 backdrop-blur-sm border border-[#135261]/15 text-white relative rounded-2xl rounded-br-md shadow-lg" : "px-4 py-3 bg-white/3 backdrop-blur-sm border border-white/10 text-white relative rounded-2xl rounded-bl-md shadow-lg"}>
                            {/* Avatar always positioned on the left side */}
                            <div className="absolute top-3 left-4">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                {message.type === 'system' ? <AvatarFallback className="bg-teal-500 border-0 font-normal text-white p-0 overflow-hidden">
                                    <img src="/lovable-uploads/5bccb031-ee60-4a74-af7a-d752ba7e9370.png" alt="Assistant logo" className="w-full h-full object-cover" />
                                  </AvatarFallback> : <AvatarFallback className="text-white border-0 font-normal text-xs" style={{
                              backgroundColor: '#648936'
                            }}>
                                    U
                                  </AvatarFallback>}
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
                      </div>)}
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Input Area - matching Chat page styling */}
            {!isComplete && sessionData && <div className="flex-shrink-0 flex justify-center px-6 mb-6">
                <div className="w-full max-w-2xl">
                  <div className="relative">
                    <Input type="text" placeholder="What are you thinking?" value={currentResponse} onChange={e => setCurrentResponse(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} style={{
                  outline: 'none',
                  boxShadow: 'none'
                }} className="w-full border border-white/[0.17] text-white placeholder:text-white/80 font-dm-sans font-normal text-sm py-4 px-5 pr-14 focus:outline-none focus:ring-0 focus:border-white/[0.17] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none !outline-none !ring-0 !ring-offset-0 transition-all duration-200 h-12 shadow-sm hover:border-white/[0.17] rounded-lg bg-white/[0.17]" />
                    <Button onClick={submitResponse} disabled={!currentResponse.trim() || isLoading} size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black border-0 rounded-full w-8 h-8 p-0 font-medium shadow-none transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-60 disabled:bg-gray-400 bg-white hover:bg-white/90">
                      {isLoading ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>}

            {/* Disclaimer positioned at bottom */}
            <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{
            bottom: '2px'
          }}>
              <p className="text-center text-[10px] font-light text-white/[0.54] whitespace-nowrap">
                Money Coach is experimental and may make mistakes.
              </p>
            </div>

            {/* Completion State */}
            {isComplete && !showFeedback && <div className="flex-shrink-0 p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-emerald-400">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-light text-white text-lg">Intervention Complete!</span>
                  </div>
                  <p className="text-sm text-white/80 font-light max-w-md mx-auto">
                    Congratulations on completing this reflection journey. Your insights are valuable - please share your feedback to help us improve.
                  </p>
                  <Button onClick={() => setShowFeedback(true)} className="bg-emerald-500/70 hover:bg-emerald-500/80 text-white border-0 rounded-xl px-8 py-3">
                    Continue to Feedback
                  </Button>
                </div>
              </div>}

            {/* Loading State */}
            {isLoading && !sessionData && <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-8">
                  <div className="space-y-6">
                    <p className="text-white font-dm-sans font-light text-xl">You're not alone in this.</p>
                    <div className="w-full max-w-xs mx-auto">
                      <Progress value={progressValue} className="h-1 bg-white/10" />
                    </div>
                    <p className="text-white/80 font-dm-sans font-light text-xl">
                      We're preparing some<br />
                      gentle next steps.
                    </p>
                  </div>
                </div>
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default InterventionModal;