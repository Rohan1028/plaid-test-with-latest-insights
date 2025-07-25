import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  loadChatMessagesOptimized, 
  maybeCleanupQueryCache, 
  loadUserDataOptimized, 
  loadInterventionsOptimized,
  queryPerformanceMonitor,
  formatTimestampOptimized 
} from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sessionId?: string;
  isConsentRequest?: boolean;
  interventionPreview?: any;
}

interface ChatCache {
  chatHistory: { [userId: string]: { messages: Message[], timestamp: number } };
  sessionData: { [userId: string]: { sessionId: string, timestamp: number } };
  userPreferences: { [userId: string]: { lastActive: number } };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
}

export const useMoneyCoachChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasShownSessionGreeting, setHasShownSessionGreeting] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAwaitingConsent, setIsAwaitingConsent] = useState(false);
  const { user } = useAuth();

  // Streaming support constants
  const STREAMING_MODE = true;
  const SUPABASE_FUNCTION_URL = "https://lnjxsfxymutsksmzduss.supabase.co/functions/v1/money-coach-chat";

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for chat history
  const SESSION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for session data
  const MAX_CACHED_MESSAGES = 100; // Limit memory usage

  // Cache and metrics refs (persistent across renders)
  const cacheRef = useRef<ChatCache>({
    chatHistory: {},
    sessionData: {},
    userPreferences: {}
  });

  const metricsRef = useRef<CacheMetrics>({
    hits: 0,
    misses: 0,
    errors: 0
  });

  // Safe cache operations with error handling
  const getCachedChatHistory = (userId: string): Message[] | null => {
    try {
      const cached = cacheRef.current.chatHistory[userId];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        metricsRef.current.hits++;
        console.log('✅ Cache HIT: Chat history for user:', userId, 
          'Messages:', cached.messages.length, 
          'Age:', Math.round((Date.now() - cached.timestamp) / 1000), 'seconds');
        return cached.messages;
      }
      if (cached) {
        // Expired cache, remove it
        delete cacheRef.current.chatHistory[userId];
        console.log('🕒 Cache EXPIRED: Removed stale chat history for user:', userId);
      }
      metricsRef.current.misses++;
      return null;
    } catch (error) {
      console.error('❌ Cache error in getCachedChatHistory:', error);
      metricsRef.current.errors++;
      return null;
    }
  };

  const setCachedChatHistory = (userId: string, messages: Message[]): void => {
    try {
      // Limit cache size to prevent memory issues
      const messagesToCache = messages.slice(-MAX_CACHED_MESSAGES);
      
      cacheRef.current.chatHistory[userId] = {
        messages: messagesToCache.map(msg => ({ ...msg })), // Deep copy to prevent mutations
        timestamp: Date.now()
      };
      console.log('💾 Cached chat history for user:', userId, 
        'Messages:', messagesToCache.length, 
        'Total cache entries:', Object.keys(cacheRef.current.chatHistory).length);
    } catch (error) {
      console.error('❌ Error caching chat history:', error);
      metricsRef.current.errors++;
    }
  };

  const getCachedSessionData = (userId: string): string | null => {
    try {
      const cached = cacheRef.current.sessionData[userId];
      if (cached && Date.now() - cached.timestamp < SESSION_CACHE_DURATION) {
        console.log('✅ Cache HIT: Session data for user:', userId);
        return cached.sessionId;
      }
      if (cached) {
        delete cacheRef.current.sessionData[userId];
      }
      return null;
    } catch (error) {
      console.error('❌ Cache error in getCachedSessionData:', error);
      return null;
    }
  };

  const setCachedSessionData = (userId: string, sessionId: string): void => {
    try {
      cacheRef.current.sessionData[userId] = {
        sessionId,
        timestamp: Date.now()
      };
      console.log('💾 Cached session data for user:', userId, 'Session:', sessionId);
    } catch (error) {
      console.error('❌ Error caching session data:', error);
    }
  };

  // Cache cleanup function
  const cleanupCache = (): void => {
    try {
      const now = Date.now();
      let cleanedHistory = 0;
      let cleanedSessions = 0;

      // Clean expired chat history
      Object.keys(cacheRef.current.chatHistory).forEach(userId => {
        const entry = cacheRef.current.chatHistory[userId];
        if (now - entry.timestamp >= CACHE_DURATION) {
          delete cacheRef.current.chatHistory[userId];
          cleanedHistory++;
        }
      });

      // Clean expired session data
      Object.keys(cacheRef.current.sessionData).forEach(userId => {
        const entry = cacheRef.current.sessionData[userId];
        if (now - entry.timestamp >= SESSION_CACHE_DURATION) {
          delete cacheRef.current.sessionData[userId];
          cleanedSessions++;
        }
      });

      if (cleanedHistory > 0 || cleanedSessions > 0) {
        console.log('🧹 Cache cleanup:', cleanedHistory, 'history entries,', cleanedSessions, 'session entries removed');
      }
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  };

  // Log cache metrics periodically
  const logCacheMetrics = (): void => {
    const metrics = metricsRef.current;
    const total = metrics.hits + metrics.misses;
    const hitRate = total > 0 ? (metrics.hits / total * 100).toFixed(1) : '0.0';
    
    console.log('📊 Cache Metrics - Hit Rate:', hitRate + '%', 
      'Hits:', metrics.hits, 
      'Misses:', metrics.misses, 
      'Errors:', metrics.errors);
  };

  // Set up periodic cache maintenance
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupCache();
      maybeCleanupQueryCache(); // Also cleanup database query cache
    }, 2 * 60 * 1000); // Every 2 minutes
    
    const metricsInterval = setInterval(logCacheMetrics, 10 * 60 * 1000); // Every 10 minutes

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  const saveMessageToDatabase = async (message: Message) => {
    if (!user || message.id === 'welcome' || message.id.startsWith('session-greeting')) return;

    // Optimistic cache update - update cache immediately
    try {
      if (user) {
        const cached = cacheRef.current.chatHistory[user.id];
        if (cached) {
          cached.messages.push({ ...message }); // Add copy to cache
          cached.timestamp = Date.now(); // Update cache timestamp
        }
      }
    } catch (error) {
      console.error('❌ Error in optimistic cache update:', error);
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          content: message.content,
          role: message.role,
          session_id: message.sessionId || null,
        }]);

      if (error) {
        console.error('Error saving message to database:', error);
        // Rollback optimistic update on database error
        if (user) {
          const cached = cacheRef.current.chatHistory[user.id];
          if (cached && cached.messages.length > 0) {
            cached.messages.pop(); // Remove the optimistically added message
          }
        }
      } else {
        console.log('Message saved to database:', message.role, 'Session ID:', message.sessionId);
      }
    } catch (error) {
      console.error('Error in saveMessageToDatabase:', error);
      // Rollback optimistic update on error
      if (user) {
        const cached = cacheRef.current.chatHistory[user.id];
        if (cached && cached.messages.length > 0) {
          cached.messages.pop();
        }
      }
    }
  };

  const showWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      content: "Hi there! I'm here to help you heal your relationship with money. How are you doing today?",
      role: 'assistant',
      timestamp: new Date(),
    }]);
  };

  const showSessionGreeting = () => {
    if (hasShownSessionGreeting) return;
    
    const sessionGreeting: Message = {
      id: `session-greeting-${Date.now()}`,
      content: "Welcome back! I'm glad to see you again. How has your journey with money been since we last spoke?",
      role: 'assistant',
      timestamp: new Date(),
      sessionId: currentSessionId || undefined,
    };
    
    setMessages(prev => [...prev, sessionGreeting]);
    saveMessageToDatabase(sessionGreeting);
    setHasShownSessionGreeting(true);
  };

  const loadChatHistory = async () => {
    if (!user) return;

    // Try cache first
    const cachedMessages = getCachedChatHistory(user.id);
    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
      setIsLoadingHistory(false);
      
      // Try to get session from cache
      const cachedSessionId = getCachedSessionData(user.id);
      if (cachedSessionId) {
        setCurrentSessionId(cachedSessionId);
      }
      
      showSessionGreeting();
      return;
    }

    try {
      console.log('🔄 Cache MISS: Loading fresh chat history for user:', user.id);
      setIsLoadingHistory(true);

      // Use ultra-optimized database loading with timezone optimization
      const { data: chatMessages, error, fromCache } = await queryPerformanceMonitor.trackQuery(
        `loadChatHistory_${user.id}`,
        () => loadChatMessagesOptimized({
          supabaseClient: supabase,
          userId: user.id,
          limit: 50,
        })
      );

      if (error) {
        console.error('Error loading chat history:', error);
        showWelcomeMessage();
      } else if (chatMessages && chatMessages.length > 0) {
        console.log('📥 Loaded chat history:', chatMessages.length, 'messages', fromCache ? '(cached)' : '(fresh)');
        
        // Reverse to get chronological order - timestamps are already optimized
        const reversedMessages = chatMessages.reverse();
        const formattedMessages = reversedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: msg.timestamp || new Date(msg.created_at), // Use optimized timestamp
          sessionId: msg.session_id || undefined,
        }));
        
        setMessages(formattedMessages);
        setCachedChatHistory(user.id, formattedMessages); // Cache the results
        
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        if (lastMessage?.sessionId) {
          setCurrentSessionId(lastMessage.sessionId);
          setCachedSessionData(user.id, lastMessage.sessionId);
        }
        
        showSessionGreeting();
      } else {
        console.log('No chat history found, showing welcome message');
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
      showWelcomeMessage();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load chat history when user is authenticated
  useEffect(() => {
    if (!user) {
      console.log('No user found, clearing messages');
      setMessages([]);
      setCurrentSessionId(null);
      setIsLoadingHistory(false);
      return;
    }

    loadChatHistory();
  }, [user]);

  // Update cache when messages change (but avoid infinite loops)
  useEffect(() => {
    if (messages.length > 0 && user && !isLoadingHistory) {
      setCachedChatHistory(user.id, messages);
      
      // Preemptive loading - background load commonly needed data
      if (messages.length > 0) {
        preemptivelyLoadData();
      }
    }
  }, [messages, user, isLoadingHistory]);

  // =============================================================================
  // PREEMPTIVE LOADING SYSTEM
  // =============================================================================

  /**
   * Background load commonly needed data for instant interactions
   */
  const preemptivelyLoadData = async () => {
    if (!user) return;

    try {
      // Only run preemptive loading occasionally to avoid overwhelming the system
      const lastPreemptiveLoad = localStorage.getItem(`preemptive_${user.id}`);
      const now = Date.now();
      
      if (lastPreemptiveLoad && now - parseInt(lastPreemptiveLoad) < 2 * 60 * 1000) {
        return; // Skip if we loaded within last 2 minutes
      }

      console.log('🚀 Starting preemptive data loading...');
      localStorage.setItem(`preemptive_${user.id}`, now.toString());

      // Background load user profile and intake data
      queueMicrotask(async () => {
        try {
          const { profile, intakeResponses, messageCounters, fromCache } = await loadUserDataOptimized({
            supabaseClient: supabase,
            userId: user.id,
          });

          console.log('🎯 Preemptively loaded user data:', {
            profile: !!profile,
            intakeCount: intakeResponses.length,
            messageCounters: !!messageCounters,
            cached: fromCache
          });
        } catch (error) {
          console.error('❌ Preemptive user data loading failed:', error);
        }
      });

      // Background load intervention data
      queueMicrotask(async () => {
        try {
          const { availableInterventions, userHistory, fromCache } = await loadInterventionsOptimized({
            supabaseClient: supabase,
            userId: user.id,
          });

          console.log('🎯 Preemptively loaded intervention data:', {
            available: availableInterventions.length,
            historyCount: userHistory.length,
            cached: fromCache
          });
        } catch (error) {
          console.error('❌ Preemptive intervention loading failed:', error);
        }
      });

      // Background analyze message patterns for predictions
      if (messages.length >= 3) {
        queueMicrotask(() => {
          try {
            analyzeMessagePatternsForPrediction();
          } catch (error) {
            console.error('❌ Message pattern analysis failed:', error);
          }
        });
      }

    } catch (error) {
      console.error('❌ Preemptive loading system error:', error);
    }
  };

  /**
   * Analyze recent message patterns to predict user needs
   */
  const analyzeMessagePatternsForPrediction = () => {
    if (messages.length < 3) return;

    const recentMessages = messages.slice(-5);
    const userMessages = recentMessages.filter(m => m.role === 'user');
    
    if (userMessages.length < 2) return;

    // Detect patterns that might indicate upcoming needs
    const patterns = {
      needsReflection: false,
      needsEncouragement: false,
      needsGuidance: false,
      topic: 'general'
    };

    const lastUserMessage = userMessages[userMessages.length - 1].content.toLowerCase();
    
    // Emotion-related keywords suggesting need for interventions
    const emotionKeywords = ['stressed', 'anxious', 'worried', 'scared', 'overwhelmed', 'frustrated', 'sad', 'angry'];
    const guidanceKeywords = ['help', 'don\'t know', 'confused', 'stuck', 'what should', 'how do i'];
    const reflectionKeywords = ['feel', 'think', 'realize', 'understand', 'learning'];

    patterns.needsReflection = reflectionKeywords.some(keyword => lastUserMessage.includes(keyword));
    patterns.needsEncouragement = emotionKeywords.some(keyword => lastUserMessage.includes(keyword));
    patterns.needsGuidance = guidanceKeywords.some(keyword => lastUserMessage.includes(keyword));

    // Topic detection for targeted preloading
    if (lastUserMessage.includes('debt') || lastUserMessage.includes('owe')) {
      patterns.topic = 'debt';
    } else if (lastUserMessage.includes('save') || lastUserMessage.includes('saving')) {
      patterns.topic = 'saving';
    } else if (lastUserMessage.includes('spend') || lastUserMessage.includes('buy')) {
      patterns.topic = 'spending';
    } else if (lastUserMessage.includes('budget')) {
      patterns.topic = 'budgeting';
    }

    console.log('🔮 Predicted user patterns:', patterns);

    // Cache predictions for instant access
    const predictionKey = `predictions_${user.id}`;
    const predictions = {
      ...patterns,
      timestamp: Date.now(),
      confidence: calculatePredictionConfidence(patterns, recentMessages)
    };

    try {
      localStorage.setItem(predictionKey, JSON.stringify(predictions));
      console.log('💾 Cached user predictions for instant access');
    } catch (error) {
      console.error('❌ Failed to cache predictions:', error);
    }
  };

  /**
   * Calculate confidence score for predictions
   */
  const calculatePredictionConfidence = (patterns: any, recentMessages: any[]): number => {
    let confidence = 0.5; // Base confidence

    const userMessages = recentMessages.filter(m => m.role === 'user');
    
    // Higher confidence if user has been consistently emotional
    const emotionalMessages = userMessages.filter(m => 
      ['stressed', 'anxious', 'worried', 'scared', 'overwhelmed'].some(keyword => 
        m.content.toLowerCase().includes(keyword)
      )
    );

    if (emotionalMessages.length >= 2) confidence += 0.3;
    if (userMessages.length >= 3) confidence += 0.1;
    if (patterns.topic !== 'general') confidence += 0.1;

    return Math.min(confidence, 0.95);
  };

  /**
   * Get cached predictions for instant user need anticipation
   */
  const getCachedPredictions = () => {
    if (!user) return null;

    try {
      const predictionKey = `predictions_${user.id}`;
      const cached = localStorage.getItem(predictionKey);
      
      if (!cached) return null;

      const predictions = JSON.parse(cached);
      const age = Date.now() - predictions.timestamp;
      
      // Predictions valid for 10 minutes
      if (age > 10 * 60 * 1000) {
        localStorage.removeItem(predictionKey);
        return null;
      }

      return predictions;
    } catch (error) {
      console.error('❌ Failed to get cached predictions:', error);
      return null;
    }
  };

  /**
   * Preemptively warm up intervention system if patterns suggest need
   */
  const warmupInterventionSystem = async () => {
    const predictions = getCachedPredictions();
    if (!predictions || predictions.confidence < 0.7) return;

    console.log('🔥 Warming up intervention system based on predictions...');

    // This could pre-fetch intervention data, warm up AI context, etc.
    // For now, we'll just log the warming up process
    if (predictions.needsReflection) {
      console.log('🎯 Prepping reflection interventions...');
    }
    
    if (predictions.needsEncouragement) {
      console.log('🎯 Prepping encouragement responses...');
    }
    
    if (predictions.needsGuidance) {
      console.log('🎯 Prepping guidance materials...');
    }
  };

  // Run warmup when component mounts and user is available
  useEffect(() => {
    if (user && messages.length > 0) {
      // Small delay to not interfere with initial loading
      const warmupTimer = setTimeout(warmupInterventionSystem, 1000);
      return () => clearTimeout(warmupTimer);
    }
  }, [user, messages.length]);

  // Invalidate user cache when user changes
  useEffect(() => {
    return () => {
      if (user) {
        // Clean up this user's cache when component unmounts or user changes
        delete cacheRef.current.chatHistory[user.id];
        delete cacheRef.current.sessionData[user.id];
      }
    };
  }, [user]);

  const sendMessage = async (userMessage: string) => {
    if (!user) return;

    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      timestamp: new Date(),
      sessionId: currentSessionId || undefined,
    };

    setMessages(prev => [...prev, newUserMessage]);
    // Make user message save non-blocking for faster UX
    saveMessageToDatabase(newUserMessage);

    let responseData = null;

    try {
      if (STREAMING_MODE) {
        // ----- Streaming request path -----
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;

          const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userMessage,
              conversationHistory: messages.map(msg => ({ role: msg.role, content: msg.content })),
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Streaming request failed: ${response.status}`);
          }

          // Check if response is JSON (intervention) instead of streaming
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            console.log('Received JSON response instead of stream - checking for intervention');
            const jsonData = await response.json();
            responseData = jsonData;
            
            // Handle intervention response
            if (jsonData.intervention || jsonData.consent_request || jsonData.awaiting_consent) {
              setIsLoading(false);
              return jsonData;
            }
            
            // Handle regular JSON response
            if (jsonData.message) {
              const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                content: jsonData.message,
                role: 'assistant',
                timestamp: new Date(),
                sessionId: currentSessionId || undefined,
              };
              setMessages(prev => [...prev, assistantMessage]);
              saveMessageToDatabase(assistantMessage);
              
              if (jsonData.session_info?.session_id) {
                setCurrentSessionId(jsonData.session_info.session_id);
              }
              setIsLoading(false);
              return jsonData;
            }
          }

          if (!response.body) {
            throw new Error('No response body for streaming');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          const assistantId = `assistant-${Date.now()}`;
          let assistantContent = '';

          // Insert placeholder assistant message
          setMessages(prev => [...prev, {
            id: assistantId,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            sessionId: currentSessionId || undefined,
          }]);

          const processChunk = async () => {
            const { value, done } = await reader.read();
            if (done) {
              // Finalize: save full assistant message (non-blocking)
              saveMessageToDatabase({
                id: assistantId,
                content: assistantContent,
                role: 'assistant',
                timestamp: new Date(),
                sessionId: currentSessionId || undefined,
              });
              setIsLoading(false);
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const raw of lines) {
              const line = raw.trim();
              if (!line.startsWith('data:')) continue;
              const dataStr = line.slice(5).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const json = JSON.parse(dataStr);
                const token = json?.choices?.[0]?.delta?.content;
                if (token) {
                  assistantContent += token;
                  setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: assistantContent } : msg));
                }
              } catch (_) {
                // Ignore parsing errors for non-JSON SSE events
              }
            }

            await processChunk();
          };

          await processChunk();
          return; // Exit successfully from streaming path

        } catch (streamError) {
          console.warn('Streaming failed, falling back to non-streaming mode:', streamError);
          // Continue to non-streaming fallback below
        }
      }

      // ----- Non-streaming path (either by choice or as fallback) -----
      console.log('Using non-streaming mode');
      const { data, error } = await supabase.functions.invoke('money-coach-chat', {
        body: {
          message: userMessage,
          conversationHistory: messages.map(msg => ({ role: msg.role, content: msg.content })),
        },
      });

      if (error) throw error;

      responseData = data;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        sessionId: currentSessionId || undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);
      // Make database save non-blocking for better UX
      saveMessageToDatabase(assistantMessage);

      if (data.session_info?.session_id) {
        setCurrentSessionId(data.session_info.session_id);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        sessionId: currentSessionId || undefined,
      };
      setMessages(prev => [...prev, errorMessage]);
      // Make error message save non-blocking too
      saveMessageToDatabase(errorMessage);
    } finally {
      // Always clean up loading state (streaming handles its own cleanup)
      setIsLoading(false);
    }

    return responseData;
  };

  const handleConsentResponse = async (isYes: boolean) => {
    const userMessage = isYes ? 'Yes, I would like to try that reflection exercise.' : 'No, I would prefer to continue our conversation as we are.';
    setIsAwaitingConsent(false);
    
    const data = await sendMessage(userMessage);
    return data;
  };

  const addAssistantMessage = async (content: string, options: Partial<Message> = {}) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content,
      role: 'assistant',
      timestamp: new Date(),
      sessionId: currentSessionId || undefined,
      ...options,
    };

    setMessages(prev => [...prev, assistantMessage]);
    await saveMessageToDatabase(assistantMessage);
  };

  return {
    messages,
    setMessages,
    isLoading,
    isLoadingHistory,
    currentSessionId,
    setCurrentSessionId,
    isAwaitingConsent,
    setIsAwaitingConsent,
    sendMessage,
    handleConsentResponse,
    addAssistantMessage,
    saveMessageToDatabase,
  };
};
