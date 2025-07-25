import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CACHING INFRASTRUCTURE
// =============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalSize: number;
}

// Global cache storage (persists across function calls in same container)
const globalCache = new Map<string, CacheEntry>();
const cacheMetrics: CacheMetrics = { hits: 0, misses: 0, errors: 0, totalSize: 0 };

// Cache TTL constants (Time To Live)
const CACHE_TTL = {
  USER_CONTEXT: 5 * 60 * 1000,        // 5 minutes - user context and memories
  MEM0_SEARCH: 3 * 60 * 1000,         // 3 minutes - Mem0 search results
  INTERVENTIONS: 10 * 60 * 1000,      // 10 minutes - available interventions
  INTAKE_RESPONSES: 15 * 60 * 1000,   // 15 minutes - user intake data
  AI_RESPONSES: 10 * 60 * 1000,       // 10 minutes - similar AI responses
  SESSION_DATA: 30 * 60 * 1000,       // 30 minutes - session information
  DB_QUERIES: 5 * 60 * 1000,          // 5 minutes - general database queries
};

// Cache size limits to prevent memory issues
const CACHE_LIMITS = {
  MAX_ENTRIES: 1000,
  MAX_ENTRY_SIZE: 50000, // 50KB per entry
  CLEANUP_THRESHOLD: 800  // Start cleanup when we hit this many entries
};

/**
 * Safe cache retrieval with error handling
 */
function getCached<T>(key: string): T | null {
  try {
    const entry = globalCache.get(key);
    if (!entry) {
      cacheMetrics.misses++;
      return null;
    }

    if (Date.now() >= entry.expiresAt) {
      globalCache.delete(key);
      cacheMetrics.misses++;
      console.log('🕒 Cache EXPIRED:', key);
      return null;
    }

    entry.accessCount++;
    cacheMetrics.hits++;
    console.log('✅ Cache HIT:', key, `(accessed ${entry.accessCount} times)`);
    return entry.data as T;
  } catch (error) {
    console.error('❌ Cache retrieval error for key:', key, error);
    cacheMetrics.errors++;
    return null;
  }
}

/**
 * Safe cache storage with size limits and error handling
 */
function setCache<T>(key: string, data: T, ttl: number): boolean {
  try {
    // Check data size (rough estimate)
    const dataSize = JSON.stringify(data).length;
    if (dataSize > CACHE_LIMITS.MAX_ENTRY_SIZE) {
      console.warn('⚠️ Cache entry too large, skipping:', key, 'Size:', dataSize);
      return false;
    }

    // Check if we need to cleanup before adding
    if (globalCache.size >= CACHE_LIMITS.CLEANUP_THRESHOLD) {
      performCacheCleanup();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 1
    };

    globalCache.set(key, entry);
    cacheMetrics.totalSize = globalCache.size;
    
    console.log('💾 Cached:', key, 
      'TTL:', Math.round(ttl / 1000), 'seconds',
      'Total entries:', globalCache.size);
    return true;
  } catch (error) {
    console.error('❌ Cache storage error for key:', key, error);
    cacheMetrics.errors++;
    return false;
  }
}

/**
 * Invalidate cache entries matching a pattern
 */
function invalidateCache(pattern: string): number {
  try {
    const keysToDelete = Array.from(globalCache.keys())
      .filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => globalCache.delete(key));
    cacheMetrics.totalSize = globalCache.size;
    
    if (keysToDelete.length > 0) {
      console.log('🗑️ Invalidated cache entries:', keysToDelete.length, 'Pattern:', pattern);
    }
    
    return keysToDelete.length;
  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Clean up expired entries and manage cache size
 */
function performCacheCleanup(): void {
  try {
    const now = Date.now();
    let expiredCount = 0;
    let removedCount = 0;

    // Remove expired entries
    for (const [key, entry] of globalCache.entries()) {
      if (now >= entry.expiresAt) {
        globalCache.delete(key);
        expiredCount++;
      }
    }

    // If still too large, remove least accessed entries
    if (globalCache.size > CACHE_LIMITS.MAX_ENTRIES) {
      const entries = Array.from(globalCache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      const toRemove = globalCache.size - CACHE_LIMITS.MAX_ENTRIES;
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        globalCache.delete(entries[i][0]);
        removedCount++;
      }
    }

    cacheMetrics.totalSize = globalCache.size;

    if (expiredCount > 0 || removedCount > 0) {
      console.log('🧹 Cache cleanup:', {
        expired: expiredCount,
        removed: removedCount,
        remaining: globalCache.size
      });
    }
  } catch (error) {
    console.error('❌ Cache cleanup error:', error);
  }
}

/**
 * Get cache metrics and performance stats
 */
function getCacheMetrics(): CacheMetrics & { hitRate: string; avgAge: number } {
  const total = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = total > 0 ? (cacheMetrics.hits / total * 100).toFixed(1) + '%' : '0.0%';
  
  // Calculate average cache age
  const now = Date.now();
  let totalAge = 0;
  let count = 0;
  
  for (const entry of globalCache.values()) {
    totalAge += (now - entry.timestamp);
    count++;
  }
  
  const avgAge = count > 0 ? Math.round(totalAge / count / 1000) : 0; // in seconds

  return {
    ...cacheMetrics,
    hitRate,
    avgAge
  };
}

/**
 * Create a cache key from multiple components
 */
function createCacheKey(...components: (string | number)[]): string {
  return components.join('_').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
}

/**
 * Create a hash from content for similarity caching
 */
function createContentHash(content: string): string {
  // Simple hash function for content similarity
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Set up periodic cache maintenance (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function maybePerformMaintenance(): void {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    performCacheCleanup();
    lastCleanup = now;
    
    // Log metrics periodically
    const metrics = getCacheMetrics();
    console.log('📊 Cache Metrics:', metrics);
  }
}

// =============================================================================
// EXISTING FUNCTIONS (keeping original code)
// =============================================================================

// Helper function to add delay for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Memory retrieval optimization constants
const MEM0_SEARCH_LIMIT = 5; // Reduced from 10 for better performance

// ---------------------------------------------------------------------------
// Fast model for background (non-blocking) work
// ---------------------------------------------------------------------------
// All memory-analysis, simplified analysis, intake analysis and intervention
// selection calls now hit this cheaper + faster deployment, while the main
// chat response continues to use the full GPT-4 deployment.
const SIDE_DEPLOYMENT = 'gpt-4o-mini';
const SIDE_MODEL = 'gpt-4o-mini';

// Function to retrieve individual memory content by ID
async function retrieveMemoryContent(memoryId: string, mem0ApiKey: string, userId: string): Promise<string | null> {
  try {
    console.log(`Retrieving memory content for ID: ${memoryId}`);
    
    const retrieveResponse = await fetch(`https://api.mem0.ai/v1/memories/${memoryId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mem0ApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Memory ${memoryId} retrieve response status:`, retrieveResponse.status);

    if (retrieveResponse.ok) {
      const memoryData = await retrieveResponse.json();
      console.log(`Memory ${memoryId} structure:`, Object.keys(memoryData));
      
      // Extract memory content from various possible fields
      const memoryContent = memoryData.memory || memoryData.text || memoryData.content || memoryData.data;
      
      if (memoryContent && typeof memoryContent === 'string' && memoryContent.trim().length > 0) {
        console.log(`Memory ${memoryId} content extracted (length: ${memoryContent.length})`);
        return memoryContent.trim();
      } else {
        console.log(`Memory ${memoryId} has no valid content:`, memoryContent);
        return null;
      }
    } else {
      const errorText = await retrieveResponse.text();
      console.error(`Failed to retrieve memory ${memoryId}:`, retrieveResponse.status, errorText);
      return null;
    }
  } catch (error) {
    console.error(`Exception retrieving memory ${memoryId}:`, error);
    return null;
  }
}

// Function to analyze conversation for memory-worthy insights
async function analyzeConversationForMemory(
  userMessage: string, 
  assistantResponse: string, 
  conversationHistory: any[], 
  azureApiKey: string, 
  azureEndpoint: string
): Promise<{ shouldCommit: boolean; insights: string[]; categories: string[] }> {
  try {
    console.log('=== ANALYZING CONVERSATION FOR MEMORY INSIGHTS ===');
    
    const analysisPrompt = `You are a memory analyst for a money coaching AI. Analyze this conversation exchange to determine if it contains insights worth remembering about the user's relationship with money.

Recent conversation context:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current exchange:
User: ${userMessage}
Assistant: ${assistantResponse}

Analyze for the following types of insights:
1. FINANCIAL BEHAVIORS: Spending patterns, saving habits, money decisions
2. EMOTIONAL PATTERNS: Money triggers, fears, anxieties, beliefs about money
3. BREAKTHROUGH MOMENTS: Realizations, "aha" moments, shifts in perspective
4. PERSONAL CONTEXT: Life events affecting finances, family money dynamics
5. GOALS & ASPIRATIONS: Financial goals, dreams, plans mentioned
6. PROGRESS TRACKING: Improvements, setbacks, learning moments

Respond in JSON format:
{
  "shouldCommit": boolean,
  "insights": ["specific insight 1", "specific insight 2"],
  "categories": ["category1", "category2"],
  "reasoning": "why this should/shouldn't be committed to memory"
}

Only mark shouldCommit as true if there are genuinely meaningful insights about the user's money relationship that would help provide better coaching in future conversations.`;

    const response = await fetch(`${azureEndpoint}/openai/deployments/${SIDE_DEPLOYMENT}/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SIDE_MODEL,
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Analyze this conversation for memory-worthy insights.' }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Memory analysis failed:', response.status);
      return { shouldCommit: false, insights: [], categories: [] };
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);
    
    console.log('Memory analysis result:', analysisResult);
    return {
      shouldCommit: analysisResult.shouldCommit || false,
      insights: analysisResult.insights || [],
      categories: analysisResult.categories || []
    };

  } catch (error) {
    console.error('Error in memory analysis:', error);
    return { shouldCommit: false, insights: [], categories: [] };
  }
}

// Function to commit insights to Mem0
async function commitInsightsToMem0(
  insights: string[], 
  categories: string[], 
  userId: string, 
  mem0ApiKey: string,
  conversationContext: string
): Promise<{ success: boolean; memoriesCreated: number }> {
  try {
    console.log('=== COMMITTING INSIGHTS TO MEM0 ===');
    console.log(`Committing ${insights.length} insights for user ${userId}`);
    
    let memoriesCreated = 0;

    for (const insight of insights) {
      try {
        const memoryPayload = {
          messages: [
            {
              role: 'user',
              content: `Context: ${conversationContext}\n\nInsight: ${insight}`
            }
          ],
          user_id: userId,
          metadata: {
            source: 'money_coach_chat',
            categories: categories,
            timestamp: new Date().toISOString(),
            insight_type: 'conversation_analysis'
          }
        };

        console.log('Creating memory with payload:', JSON.stringify(memoryPayload, null, 2));

        const response = await fetch('https://api.mem0.ai/v1/memories/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mem0ApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(memoryPayload),
        });

        if (response.ok) {
          const memoryResult = await response.json();
          console.log(`Successfully created memory: ${memoryResult.id || 'unknown'}`);
          memoriesCreated++;
        } else {
          const errorText = await response.text();
          console.error(`Failed to create memory for insight: ${insight}`, response.status, errorText);
        }

        // Rate limiting delay
        await delay(300);

      } catch (error) {
        console.error(`Error creating memory for insight: ${insight}`, error);
      }
    }

    console.log(`=== MEMORY COMMITMENT COMPLETED: ${memoriesCreated}/${insights.length} successful ===`);
    return { success: memoriesCreated > 0, memoriesCreated };

  } catch (error) {
    console.error('Error in commitInsightsToMem0:', error);
    return { success: false, memoriesCreated: 0 };
  }
}

// NEW: Detect if this is a casual greeting or session start
function detectCasualGreeting(message: string): boolean {
  console.log('=== DETECTING CASUAL GREETING ===');
  
  const greetingPatterns = [
    // Simple greetings
    /^(hi|hello|hey|good morning|good afternoon|good evening)\.?$/i,
    /^(hi there|hello there|hey there)\.?$/i,
    
    // Greetings with punctuation
    /^(hi!|hello!|hey!)$/i,
    
    // How are you variations
    /^how are you\??$/i,
    /^how's it going\??$/i,
    /^what's up\??$/i,
    
    // Combined greeting + how are you (short)
    /^(hi|hello|hey),?\s+(how are you|what's up)\??$/i,
    
    // Very short responses
    /^(good|fine|ok|okay)\.?$/i,
    /^(thanks|thank you)\.?$/i,
    
    // "I'm back" type messages
    /^(i'm back|back|here)\.?$/i
  ];
  
  const messageWords = message.trim().toLowerCase().split(/\s+/);
  const isCasualGreeting = greetingPatterns.some(pattern => pattern.test(message.trim())) || 
                          (messageWords.length <= 3 && greetingPatterns.some(pattern => pattern.test(message.trim())));
  
  console.log('Casual greeting check:', { message: message.trim(), isCasualGreeting, wordCount: messageWords.length });
  return isCasualGreeting;
}

// NEW: Detect intervention consent responses
function detectInterventionConsent(message: string): { isConsentResponse: boolean; isYes: boolean; isNo: boolean } {
  console.log('=== DETECTING INTERVENTION CONSENT ===');
  
  const yesPatterns = [
    /^(yes|yeah|yep|sure|okay|ok|alright|sounds good)\.?$/i,
    /^(yes please|yes i would|i'd like that|that sounds helpful|let's do it)\.?$/i,
    /^(i'm interested|i want to|let's try it|go ahead)\.?$/i,
  ];
  
  const noPatterns = [
    /^(no|nope|not now|not today|maybe later)\.?$/i,
    /^(no thanks|no thank you|i'm not interested|not interested)\.?$/i,
    /^(skip it|pass|maybe another time|not right now)\.?$/i,
  ];
  
  const messageTrimmed = message.trim().toLowerCase();
  const isYes = yesPatterns.some(pattern => pattern.test(messageTrimmed));
  const isNo = noPatterns.some(pattern => pattern.test(messageTrimmed));
  const isConsentResponse = isYes || isNo;
  
  console.log('Consent detection result:', { message: messageTrimmed, isConsentResponse, isYes, isNo });
  return { isConsentResponse, isYes, isNo };
}

// NEW: Check if user is in intervention consent state
async function checkInterventionConsentState(
  userId: string,
  supabaseClient: any
): Promise<{ isInConsentState: boolean; pendingIntervention: any | null; reason: string; focusArea: string }> {
  try {
    console.log('=== CHECKING INTERVENTION CONSENT STATE ===');
    console.log('Checking consent state for user:', userId);
    
    // Check for pending intervention consent flag in user_message_counters
    const { data: counter, error } = await supabaseClient
      .from('user_message_counters')
      .select('pending_intervention_consent, pending_intervention_id, pending_intervention_reason, pending_intervention_focus')
      .eq('user_id', userId)
      .maybeSingle(); // Fixed: use maybeSingle() instead of single()

    if (error) {
      console.error('Error checking consent state:', error);
      return { isInConsentState: false, pendingIntervention: null, reason: '', focusArea: '' };
    }

    console.log('User message counter result:', counter);

    if (counter?.pending_intervention_consent && counter?.pending_intervention_id) {
      console.log('Found pending intervention consent for intervention ID:', counter.pending_intervention_id);
      
      // Get the intervention details
      const { data: intervention, error: interventionError } = await supabaseClient
        .from('interventions')
        .select('*')
        .eq('id', counter.pending_intervention_id)
        .maybeSingle(); // Fixed: use maybeSingle() instead of single()

      if (interventionError) {
        console.error('Error fetching pending intervention:', interventionError);
        return { isInConsentState: false, pendingIntervention: null, reason: '', focusArea: '' };
      }

      if (!intervention) {
        console.log('No intervention found for ID:', counter.pending_intervention_id);
        return { isInConsentState: false, pendingIntervention: null, reason: '', focusArea: '' };
      }

      console.log('User is in intervention consent state for:', intervention.name);
      return {
        isInConsentState: true,
        pendingIntervention: intervention,
        reason: counter.pending_intervention_reason || '',
        focusArea: counter.pending_intervention_focus || ''
      };
    }

    console.log('User is not in intervention consent state');
    return { isInConsentState: false, pendingIntervention: null, reason: '', focusArea: '' };

  } catch (error) {
    console.error('Error in checkInterventionConsentState:', error);
    return { isInConsentState: false, pendingIntervention: null, reason: '', focusArea: '' };
  }
}

// NEW: Set intervention consent state
async function setInterventionConsentState(
  userId: string,
  interventionId: string,
  reason: string,
  focusArea: string,
  supabaseClient: any
): Promise<void> {
  try {
    console.log('=== SETTING INTERVENTION CONSENT STATE ===');
    console.log('Setting consent state for user:', userId, 'intervention:', interventionId);
    
    const { error } = await supabaseClient
      .from('user_message_counters')
      .update({
        pending_intervention_consent: true,
        pending_intervention_id: interventionId,
        pending_intervention_reason: reason,
        pending_intervention_focus: focusArea,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting consent state:', error);
    } else {
      console.log('Intervention consent state set for intervention:', interventionId);
    }
  } catch (error) {
    console.error('Error in setInterventionConsentState:', error);
  }
}

// NEW: Clear intervention consent state
async function clearInterventionConsentState(
  userId: string,
  supabaseClient: any
): Promise<void> {
  try {
    console.log('=== CLEARING INTERVENTION CONSENT STATE ===');
    console.log('Clearing consent state for user:', userId);
    
    const { error } = await supabaseClient
      .from('user_message_counters')
      .update({
        pending_intervention_consent: false,
        pending_intervention_id: null,
        pending_intervention_reason: null,
        pending_intervention_focus: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing consent state:', error);
    } else {
      console.log('Intervention consent state cleared');
    }
  } catch (error) {
    console.error('Error in clearInterventionConsentState:', error);
  }
}

// NEW: Detect session boundaries based on time gaps and message patterns
async function detectSessionBoundary(
  userId: string,
  currentMessage: string,
  supabaseClient: any
): Promise<{ isNewSession: boolean; sessionId: string; reason: string }> {
  try {
    console.log('=== DETECTING SESSION BOUNDARY ===');
    console.log('Checking session boundary for user:', userId);
    
    // Get user's message counter with session info
    const { data: counter, error: counterError } = await supabaseClient
      .from('user_message_counters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Fixed: use maybeSingle() instead of single()

    if (counterError) {
      console.error('Error fetching message counter:', counterError);
      return { 
        isNewSession: true, 
        sessionId: crypto.randomUUID(), 
        reason: 'counter_error' 
      };
    }

    const now = new Date();
    const SESSION_TIMEOUT_MINUTES = 30; // 30 minutes threshold
    
    // If no counter exists, this is definitely a new session
    if (!counter) {
      console.log('No message counter found - new session');
      return { 
        isNewSession: true, 
        sessionId: crypto.randomUUID(), 
        reason: 'no_history' 
      };
    }

    console.log('Found message counter:', counter);

    // Check time gap since last message
    let isNewSessionByTime = false;
    let timeSinceLastMessage = 0;
    
    if (counter.last_message_at) {
      const lastMessageTime = new Date(counter.last_message_at);
      timeSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60); // minutes
      isNewSessionByTime = timeSinceLastMessage > SESSION_TIMEOUT_MINUTES;
      console.log('Time since last message:', timeSinceLastMessage, 'minutes');
    } else {
      isNewSessionByTime = true; // No last message time means new session
      console.log('No last message time - new session');
    }

    // Check if message is a casual greeting
    const isCasualGreeting = detectCasualGreeting(currentMessage);
    
    // Decision logic for new session
    let isNewSession = false;
    let reason = '';

    if (isNewSessionByTime && isCasualGreeting) {
      isNewSession = true;
      reason = `time_gap_with_greeting (${Math.round(timeSinceLastMessage)}min gap)`;
    } else if (isNewSessionByTime) {
      isNewSession = true;
      reason = `time_gap (${Math.round(timeSinceLastMessage)}min gap)`;
    } else if (!counter.current_session_id) {
      isNewSession = true;
      reason = 'missing_session_id';
    }

    const sessionId = isNewSession ? crypto.randomUUID() : counter.current_session_id;
    
    console.log('Session boundary detection result:', {
      isNewSession,
      sessionId,
      reason,
      timeSinceLastMessage: Math.round(timeSinceLastMessage),
      isCasualGreeting
    });

    return { isNewSession, sessionId, reason };

  } catch (error) {
    console.error('Error in detectSessionBoundary:', error);
    return { 
      isNewSession: true, 
      sessionId: crypto.randomUUID(), 
      reason: 'detection_error' 
    };
  }
}

// NEW: Update session-aware message counter
async function updateSessionAwareMessageCounter(
  userId: string, 
  sessionId: string, 
  isNewSession: boolean,
  supabaseClient: any
): Promise<{ shouldAnalyze: boolean; messageCount: number; shouldCheckIntake: boolean; messagesSinceIntervention: number; sessionMessageCount: number }> {
  try {
    console.log('=== UPDATING SESSION-AWARE MESSAGE COUNTER ===');
    console.log('Session info:', { userId, sessionId, isNewSession });
    
    const now = new Date().toISOString();

    // Get or create user message counter
    const { data: existingCounter, error: selectError } = await supabaseClient
      .from('user_message_counters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Fixed: use maybeSingle() instead of single()

    if (selectError) {
      console.error('Error selecting message counter:', selectError);
      return { shouldAnalyze: false, messageCount: 0, shouldCheckIntake: false, messagesSinceIntervention: 0, sessionMessageCount: 0 };
    }

    console.log('Existing counter:', existingCounter);

    let newMessageCount = 1;
    let sessionMessageCount = 1;
    let shouldAnalyze = false;
    let shouldCheckIntake = false;
    let messagesSinceIntervention = 0;

    if (existingCounter) {
      newMessageCount = existingCounter.message_count + 1;
      console.log('Updating existing counter. New message count:', newMessageCount);
      
      // Parallelize database queries for better performance
      const sessionMessagePromise = !isNewSession ? 
        supabaseClient
          .from('chat_messages')
          .select('id')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
        : null;
      
      const interventionMessagePromise = existingCounter.last_intervention_at ?
        supabaseClient
          .from('chat_messages')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', existingCounter.last_intervention_at)
        : null;

      // Execute queries in parallel and handle results
      const [sessionResult, interventionResult] = await Promise.allSettled([
        sessionMessagePromise,
        interventionMessagePromise
      ]);

      // Process session message count
      if (isNewSession) {
        sessionMessageCount = 1; // First message of new session
        console.log('New session - session message count: 1');
      } else if (sessionResult.status === 'fulfilled' && sessionResult.value) {
        const { data: sessionMessages, error: sessionError } = sessionResult.value;
        if (!sessionError && sessionMessages) {
          sessionMessageCount = sessionMessages.length + 1; // +1 for current message
          console.log('Continuing session - session message count:', sessionMessageCount);
        } else {
          console.error('Error counting session messages:', sessionError);
          sessionMessageCount = 1; // Fallback
        }
      } else {
        sessionMessageCount = 1; // Fallback for rejected promise
      }
      
      // Process intervention message count
      if (interventionResult.status === 'fulfilled' && interventionResult.value) {
        const { data: messagesSince, error: messagesError } = interventionResult.value;
        if (!messagesError && messagesSince) {
          messagesSinceIntervention = messagesSince.length;
          console.log('Messages since last intervention:', messagesSinceIntervention);
        } else {
          console.error('Error counting messages since intervention:', messagesError);
          messagesSinceIntervention = newMessageCount;
        }
      } else {
        messagesSinceIntervention = newMessageCount;
        console.log('No previous intervention - messages since: ', messagesSinceIntervention);
      }
      
      // Update existing counter
      const updateData: any = { 
        message_count: newMessageCount,
        last_message_at: now,
        updated_at: now
      };

      // Update session info if new session
      if (isNewSession) {
        updateData.current_session_id = sessionId;
        updateData.session_start_at = now;
        console.log('Updating with new session info');
      }

      const { error: updateError } = await supabaseClient
        .from('user_message_counters')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating message counter:', updateError);
        return { shouldAnalyze: false, messageCount: newMessageCount, shouldCheckIntake: false, messagesSinceIntervention, sessionMessageCount };
      }

      console.log('Successfully updated message counter');
    } else {
      console.log('Creating new message counter for user');
      // Create new counter
      const { error: insertError } = await supabaseClient
        .from('user_message_counters')
        .insert([{
          user_id: userId,
          message_count: 1,
          current_session_id: sessionId,
          last_message_at: now,
          session_start_at: now,
          updated_at: now
        }]);

      if (insertError) {
        console.error('Error creating message counter:', insertError);
        return { shouldAnalyze: false, messageCount: 1, shouldCheckIntake: false, messagesSinceIntervention: 0, sessionMessageCount: 1 };
      }
      
      console.log('Successfully created new message counter');
      messagesSinceIntervention = 1;
      sessionMessageCount = 1;
    }

    // NEW SESSION LOGIC: Only analyze based on SESSION message count, not total
    // Don't analyze if this is the first message of a new session (likely a greeting)
    if (isNewSession && sessionMessageCount === 1) {
      shouldAnalyze = false;
      shouldCheckIntake = false;
      console.log('First message of new session - skipping analysis');
    } else {
      // Analyze every 5 messages within the session
      shouldAnalyze = sessionMessageCount % 5 === 0;
      
      // Check intake based on messages since last intervention (global count)
      shouldCheckIntake = messagesSinceIntervention >= 10 && messagesSinceIntervention <= 15;
      
      console.log('Analysis decision:', { shouldAnalyze, shouldCheckIntake });
    }
    
    console.log(`Counters - Total: ${newMessageCount}, Session: ${sessionMessageCount}, Should analyze: ${shouldAnalyze}, Should check intake: ${shouldCheckIntake}, Since intervention: ${messagesSinceIntervention}`);
    return { shouldAnalyze, messageCount: newMessageCount, shouldCheckIntake, messagesSinceIntervention, sessionMessageCount };

  } catch (error) {
    console.error('Error in updateSessionAwareMessageCounter:', error);
    return { shouldAnalyze: false, messageCount: 0, shouldCheckIntake: false, messagesSinceIntervention: 0, sessionMessageCount: 0 };
  }
}

// NEW: Check for immediate distress keywords
function checkForDistressKeywords(message: string): { hasDistress: boolean; keywords: string[] } {
  console.log('=== CHECKING FOR DISTRESS KEYWORDS ===');
  
  const distressKeywords = [
    // Mental health indicators
    'panic attack', 'panic attacks', 'depression', 'anxiety', 'overwhelming stress',
    'anxious', 'depressed', 'overwhelmed', 'panic', 'stressed out',
    
    // Emotional distress phrases
    "i can't handle this", "i'm falling apart", "everything is falling apart",
    "can't cope", "breaking down", "losing it", "at my breaking point",
    "can't take it anymore", "desperate", "hopeless", "helpless",
    
    // Financial crisis situations
    'foreclosure', 'bankruptcy', 'job loss', 'unemployed', 'eviction',
    'homeless', 'broke', 'no money', 'financial crisis', 'debt crisis',
    'losing my home', 'losing my job', 'fired', 'laid off',
    
    // Relationship/family stress
    'divorce', 'separation', 'family crisis', 'medical emergency',
    'emergency expenses', 'unexpected bill', 'crisis',
    
    // Emotional money language
    'money stress', 'financial anxiety', 'money panic', 'financial fear',
    'terrified about money', 'money shame', 'financial shame'
  ];
  
  const messageLower = message.toLowerCase();
  const foundKeywords = distressKeywords.filter(keyword => 
    messageLower.includes(keyword.toLowerCase())
  );
  
  const hasDistress = foundKeywords.length > 0;
  
  console.log('Distress check result:', { hasDistress, foundKeywords });
  return { hasDistress, keywords: foundKeywords };
}

// NEW: Simplified 3-level conversation analysis
async function performSimplifiedConversationAnalysis(
  userMessage: string,
  conversationHistory: any[],
  azureApiKey: string,
  azureEndpoint: string
): Promise<{ needLevel: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string; category: string }> {
  try {
    console.log('=== PERFORMING SIMPLIFIED CONVERSATION ANALYSIS ===');

    const analysisPrompt = `You are an intervention analyst for a money coaching AI. Analyze this conversation to determine the user's intervention need level.

Recent conversation context:
${conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current user message: ${userMessage}

Assess the user's need for intervention using these three levels:

HIGH NEED: User shows clear emotional distress, stuck patterns, or is struggling significantly
- Signs: Repeating same concerns, expressing overwhelm, shame, or fear
- Money anxiety/stress that seems persistent
- Stuck in circular thinking about money
- Clear breakthrough moments that need deeper exploration

MEDIUM NEED: User shows some struggle but is managing and progressing
- Signs: Occasional concerns but generally stable
- Some money stress but not overwhelming
- Making progress in conversations
- Learning and growing but not stuck

LOW NEED: User seems stable, progressing well, just needs ongoing support
- Signs: Healthy engagement with money topics
- Making progress and applying insights
- No signs of distress or being stuck
- Just needs continued coaching support

Respond in JSON format:
{
  "needLevel": "HIGH" | "MEDIUM" | "LOW",
  "reason": "brief explanation for the assessment",
  "category": "emotional_distress|stuck_patterns|breakthrough|stable_progress|healthy_engagement"
}

Be conservative - only recommend HIGH need if there's clear evidence of struggle or being stuck.`;

    const response = await fetch(`${azureEndpoint}/openai/deployments/${SIDE_DEPLOYMENT}/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SIDE_MODEL,
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Analyze this conversation for intervention need level.' }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Simplified analysis failed:', response.status);
      return { needLevel: 'LOW', reason: 'Analysis failed', category: 'stable_progress' };
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);
    
    console.log('Simplified analysis result:', analysisResult);
    return {
      needLevel: analysisResult.needLevel || 'LOW',
      reason: analysisResult.reason || 'No specific reason',
      category: analysisResult.category || 'stable_progress'
    };

  } catch (error) {
    console.error('Error in performSimplifiedConversationAnalysis:', error);
    return { needLevel: 'LOW', reason: 'Analysis error', category: 'stable_progress' };
  }
}

// NEW: Analyze intake responses for intervention opportunity
async function analyzeIntakeForIntervention(
  userId: string,
  conversationContext: string,
  supabaseClient: any,
  azureApiKey: string,
  azureEndpoint: string
): Promise<{ shouldOffer: boolean; reason: string; suggestedFocus: string }> {
  try {
    console.log('=== ANALYZING INTAKE FOR INTERVENTION OPPORTUNITY ===');
    console.log('Analyzing intake for user:', userId);
    
    // Get user's intake responses
    const { data: intakeResponses, error: intakeError } = await supabaseClient
      .from('intake_responses')
      .select('question_text, answer')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (intakeError) {
      console.error('Error fetching intake responses:', intakeError);
      return { shouldOffer: false, reason: 'Database error fetching intake data', suggestedFocus: '' };
    }

    if (!intakeResponses || intakeResponses.length === 0) {
      console.log('No intake responses found for user');
      return { shouldOffer: false, reason: 'No intake data available', suggestedFocus: '' };
    }

    console.log('Found intake responses:', intakeResponses.length);

    // Format intake data for analysis
    const intakeData = intakeResponses.map(r => `${r.question_text}: ${r.answer}`).join('\n\n');

    const analysisPrompt = `You are an intervention advisor for a money coaching AI. Based on the user's intake responses and current conversation context, determine if this is a good time to offer an intervention focused on their past issues.

User's Intake Responses:
${intakeData}

Recent Conversation Context:
${conversationContext}

Guidelines for offering intervention:
1. Look for patterns in their intake responses that suggest ongoing struggles
2. Check if current conversation shows they might benefit from deeper work on past issues
3. Consider if they seem open to reflection vs. just wanting quick chat support
4. Look for themes like: childhood money patterns, family dynamics, recurring emotional triggers, unresolved money beliefs

Respond in JSON format:
{
  "shouldOffer": boolean,
  "reason": "explanation of why this is/isn't a good time for intervention",
  "suggestedFocus": "what aspect of their intake responses to focus on (if offering)"
}

Only recommend offering an intervention if there's a clear connection between their past issues and current state that would benefit from deeper exploration.`;

    const response = await fetch(`${azureEndpoint}/openai/deployments/${SIDE_DEPLOYMENT}/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SIDE_MODEL,
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Analyze whether to offer an intervention based on intake responses.' }
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Intake analysis failed:', response.status);
      return { shouldOffer: false, reason: 'Analysis failed', suggestedFocus: '' };
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);
    
    console.log('Intake analysis result:', analysisResult);
    return {
      shouldOffer: analysisResult.shouldOffer || false,
      reason: analysisResult.reason || 'No specific reason',
      suggestedFocus: analysisResult.suggestedFocus || ''
    };

  } catch (error) {
    console.error('Error in analyzeIntakeForIntervention:', error);
    return { shouldOffer: false, reason: 'Analysis error', suggestedFocus: '' };
  }
}

// NEW: Enhanced intervention selection using Mem0 context
async function selectInterventionWithMem0Context(
  userId: string,
  reason: string,
  category: string,
  conversationContext: string,
  distressKeywords: string[],
  supabaseClient: any,
  mem0ApiKey: string,
  azureApiKey: string,
  azureEndpoint: string,
  intakeFocus?: string
): Promise<{ intervention: any | null; triggered: boolean }> {
  try {
    console.log('=== SELECTING INTERVENTION WITH MEM0 CONTEXT ===');
    console.log('Trigger reason:', reason, 'Category:', category, 'Intake focus:', intakeFocus);
    console.log('Selecting intervention for user:', userId);

    // Get all available interventions
    const { data: interventions, error: interventionsError } = await supabaseClient
      .from('interventions')
      .select('*');

    if (interventionsError) {
      console.error('Error fetching interventions:', interventionsError);
      return { intervention: null, triggered: false };
    }

    if (!interventions || interventions.length === 0) {
      console.log('No interventions found in database');
      return { intervention: null, triggered: false };
    }

    console.log('Found interventions:', interventions.length);

    // Get user's intervention history to avoid repeating
    const { data: history, error: historyError } = await supabaseClient
      .from('user_intervention_history')
      .select('intervention_id')
      .eq('user_id', userId);

    if (historyError) {
      console.error('Error fetching intervention history:', historyError);
      // Continue without history check rather than failing
    }

    const usedInterventionIds = history?.map(h => h.intervention_id) || [];
    const availableInterventions = interventions.filter(i => !usedInterventionIds.includes(i.id));

    console.log('Available interventions after filtering used ones:', availableInterventions.length);

    if (availableInterventions.length === 0) {
      console.log('No new interventions available for user');
      return { intervention: null, triggered: false };
    }

    // Get user's Mem0 memories to inform intervention selection (with graceful fallback)
    let mem0Context = '';
    let mem0Available = true;
    
    try {
      console.log('=== RETRIEVING MEM0 CONTEXT FOR INTERVENTION SELECTION ===');
      
      if (!mem0ApiKey || mem0ApiKey.trim() === '') {
        console.log('Mem0 API key not available - skipping memory context');
        mem0Available = false;
      } else {
        const searchQuery = distressKeywords.length > 0 
          ? distressKeywords.join(' ') + ' ' + conversationContext.substring(0, 200)
          : conversationContext.substring(0, 200);

        console.log('Searching Mem0 with query:', searchQuery.substring(0, 100) + '...');

        const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mem0ApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            user_id: userId,
            limit: MEM0_SEARCH_LIMIT,
            include_content: true // Try to get full content in search response
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.memories && Array.isArray(searchData.memories)) {
            // Try to get content directly from search results first
            const directContents: string[] = [];
            searchData.memories.forEach((item: any) => {
              const content = item.memory || item.text || item.content || item.data;
              if (content && typeof content === 'string' && content.trim().length > 0) {
                directContents.push(content.trim());
              }
            });

            if (directContents.length > 0) {
              // Success! Got content directly from search
              mem0Context = directContents.join('\n\n---\n\n');
              console.log('Retrieved Mem0 context for intervention selection (direct):', mem0Context.length, 'characters');
            } else {
              // Fallback to individual retrieval
              const memoryIds = searchData.memories
                .map((item: any) => item.id || item.memory_id || item._id || item.uuid)
                .filter((id: any) => id && typeof id === 'string');

              console.log('Found memory IDs:', memoryIds.length);

              const memoryContents: string[] = [];

              // Retrieve all memories in parallel to reduce latency
              const retrievalPromises = memoryIds.map((memoryId) =>
                retrieveMemoryContent(memoryId, mem0ApiKey, userId)
              );

              const retrievalResults = await Promise.allSettled(retrievalPromises);

              retrievalResults.forEach((result, idx) => {
                if (result.status === 'fulfilled' && result.value) {
                  memoryContents.push(result.value);
                  console.log(`Successfully retrieved memory ${idx + 1}/${memoryIds.length}`);
                } else {
                  console.log(`Failed to retrieve memory ${idx + 1}/${memoryIds.length}`);
                }
              });

              if (memoryContents.length > 0) {
                mem0Context = memoryContents.join('\n\n---\n\n');
                console.log('Retrieved Mem0 context for intervention selection (fallback):', mem0Context.length, 'characters');
              } else {
                console.log('No valid memory content retrieved from Mem0');
              }
            }
          } else {
            console.log('Mem0 search returned no memories or invalid format');
          }
        } else {
          const errorText = await searchResponse.text();
          console.error('Mem0 search failed:', searchResponse.status, errorText);
          mem0Available = false;
        }
      }
    } catch (error) {
      console.error('Error retrieving Mem0 context:', error);
      mem0Available = false;
    }

    // Use AI to select the most appropriate intervention
    const selectionPrompt = `You are an intervention selector for a money coaching AI. Select the most appropriate intervention based on the user's context and available options.

${mem0Available && mem0Context ? `User's Memory Context (from previous sessions):
${mem0Context}` : 'No previous memory context available (Mem0 unavailable or no stored memories)'}

Current Conversation Context:
${conversationContext}

Trigger Reason: ${reason}
Category: ${category}
Distress Keywords Found: ${distressKeywords.join(', ') || 'None'}
${intakeFocus ? `Intake Focus Area: ${intakeFocus}` : ''}

Available Interventions:
${availableInterventions.map(i => `ID: ${i.id}\nName: ${i.name}\nDescription: ${i.description}\n---`).join('\n')}

Select the intervention that would be most helpful for this user's current state and past patterns. Consider:
1. Their historical money patterns from memory context (if available)
2. Current emotional state and triggers
3. What type of reflection would be most beneficial
${intakeFocus ? '4. The specific intake focus area that needs attention' : ''}

Respond in JSON format:
{
  "selectedInterventionId": "intervention_id",
  "reasoning": "why this intervention is most appropriate for this user"
}`;

    try {
      console.log('Requesting AI intervention selection');
      const selectionResponse = await fetch(`${azureEndpoint}/openai/deployments/${SIDE_DEPLOYMENT}/chat/completions?api-version=2024-04-01-preview`, {
        method: 'POST',
        headers: {
          'api-key': azureApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: selectionPrompt },
            { role: 'user', content: 'Select the most appropriate intervention for this user.' }
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (selectionResponse.ok) {
        const selectionData = await selectionResponse.json();
        const selectionResult = JSON.parse(selectionData.choices[0].message.content);
        
        const selectedIntervention = availableInterventions.find(i => i.id === selectionResult.selectedInterventionId);
        
        if (selectedIntervention) {
          console.log('AI selected intervention:', selectedIntervention.name, 'Reasoning:', selectionResult.reasoning);
          
          // Record the intervention in user history
          const { error: insertError } = await supabaseClient
            .from('user_intervention_history')
            .insert([{
              user_id: userId,
              intervention_id: selectedIntervention.id,
              trigger_reason: reason,
              conversation_context: conversationContext,
              triggered_at: new Date().toISOString()
            }]);

          if (insertError) {
            console.error('Error recording intervention history:', insertError);
            // Continue anyway - don't fail the intervention
          }

          // Update message counter to record intervention time
          await supabaseClient
            .from('user_message_counters')
            .update({ last_intervention_at: new Date().toISOString() })
            .eq('user_id', userId);

          console.log('=== INTERVENTION SELECTED WITH MEM0 CONTEXT ===');
          console.log('Intervention:', selectedIntervention.name);
          
          return { intervention: selectedIntervention, triggered: true };
        } else {
          console.log('AI selected intervention ID not found in available interventions');
        }
      } else {
        const errorText = await selectionResponse.text();
        console.error('AI intervention selection failed:', selectionResponse.status, errorText);
      }
    } catch (error) {
      console.error('Error in AI intervention selection:', error);
    }

    // Fallback to random selection if AI selection fails
    console.log('Falling back to random intervention selection');
    const randomIntervention = availableInterventions[Math.floor(Math.random() * availableInterventions.length)];
    
    // Record the intervention in user history
    const { error: insertError } = await supabaseClient
      .from('user_intervention_history')
      .insert([{
        user_id: userId,
        intervention_id: randomIntervention.id,
        trigger_reason: reason,
        conversation_context: conversationContext,
        triggered_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Error recording intervention history:', insertError);
      // Continue anyway - don't fail the intervention
    }

    // Update message counter to record intervention time
    await supabaseClient
      .from('user_message_counters')
      .update({ last_intervention_at: new Date().toISOString() })
      .eq('user_id', userId);

    console.log('=== FALLBACK INTERVENTION SELECTED ===');
    console.log('Intervention:', randomIntervention.name);
    
    return { intervention: randomIntervention, triggered: true };

  } catch (error) {
    console.error('Error in selectInterventionWithMem0Context:', error);
    return { intervention: null, triggered: false };
  }
}

// =============================================================================
// CACHED ENHANCED FUNCTIONS
// =============================================================================

/**
 * Enhanced Mem0 search with intelligent caching
 */
async function getCachedMem0Memories(
  userId: string,
  searchQuery: string,
  mem0ApiKey: string
): Promise<{ memories: any[]; contextString: string; fromCache: boolean }> {
  const cacheKey = createCacheKey('mem0_search', userId, createContentHash(searchQuery));
  
  // Try cache first
  const cached = getCached<{ memories: any[]; contextString: string }>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  console.log('🔄 Cache MISS: Fetching fresh Mem0 memories for user:', userId);

  let memories: any[] = [];
  let contextString = '';

  try {
    if (!mem0ApiKey || mem0ApiKey.trim() === '') {
      console.log('Mem0 API key not available');
      return { memories: [], contextString: '', fromCache: false };
    }

    const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mem0ApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        user_id: userId,
        limit: MEM0_SEARCH_LIMIT,
        include_content: true
      }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      memories = searchData.memories || [];
      
      if (memories.length > 0) {
        const validMemories = memories
          .map(item => item.memory || item.text || item.content)
          .filter(content => content && typeof content === 'string' && content.trim().length > 10);
        
        contextString = validMemories.join('\n');
      }

      // Cache the results
      const result = { memories, contextString };
      setCache(cacheKey, result, CACHE_TTL.MEM0_SEARCH);
      
      console.log('📥 Fetched Mem0 memories:', memories.length, 'Context length:', contextString.length);
      return { ...result, fromCache: false };
    } else {
      console.error('Mem0 search failed:', searchResponse.status);
    }
  } catch (error) {
    console.error('Error in Mem0 search:', error);
  }

  return { memories: [], contextString: '', fromCache: false };
}

/**
 * Enhanced user context building with caching
 */
async function getCachedUserContext(
  userId: string,
  message: string,
  supabaseClient: any,
  mem0ApiKey: string
): Promise<{ 
  userContext: string; 
  contextSource: string; 
  mem0MemoryCount: number; 
  fromCache: boolean 
}> {
  const cacheKey = createCacheKey('user_context', userId);
  
  // Try cache first
  const cached = getCached<{ userContext: string; contextSource: string; mem0MemoryCount: number }>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  console.log('🔄 Cache MISS: Building fresh user context for user:', userId);

  let userContext = '';
  let contextSource = 'none';
  let mem0MemoryCount = 0;

  // Try Mem0 first
  const { memories, contextString, fromCache: mem0FromCache } = await getCachedMem0Memories(
    userId, 
    message, 
    mem0ApiKey
  );

  if (contextString) {
    userContext = contextString;
    contextSource = 'mem0';
    mem0MemoryCount = memories.length;
    console.log('✅ Using Mem0 context:', mem0MemoryCount, 'memories');
  } else {
    // Fallback to database with caching
    const dbCacheKey = createCacheKey('intake_responses', userId);
    let dbResponses = getCached<any[]>(dbCacheKey);
    
    if (!dbResponses) {
      console.log('🔄 Fetching fresh intake responses from database');
      const { data, error } = await supabaseClient
        .from('intake_responses')
        .select('question_text, answer')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        dbResponses = data;
        setCache(dbCacheKey, dbResponses, CACHE_TTL.INTAKE_RESPONSES);
      } else {
        dbResponses = [];
      }
    }

    if (dbResponses && dbResponses.length > 0) {
      userContext = dbResponses.map((r: any) => `${r.question_text}: ${r.answer}`).join('\n');
      contextSource = 'database';
      console.log('✅ Using database context:', dbResponses.length, 'responses');
    }
  }

  const result = { userContext, contextSource, mem0MemoryCount };
  setCache(cacheKey, result, CACHE_TTL.USER_CONTEXT);
  
  return { ...result, fromCache: false };
}

/**
 * Enhanced intervention selection with caching
 */
async function getCachedAvailableInterventions(
  userId: string,
  supabaseClient: any
): Promise<{ interventions: any[]; recentInterventions: Set<string>; fromCache: boolean }> {
  const cacheKey = createCacheKey('interventions', userId);
  
  // Try cache first
  const cached = getCached<{ interventions: any[]; recentInterventions: Set<string> }>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  console.log('🔄 Cache MISS: Loading fresh interventions for user:', userId);

  // Fetch all interventions
  const { data: interventions, error: interventionsError } = await supabaseClient
    .from('interventions')
    .select('*')
    .order('created_at', { ascending: true });

  if (interventionsError || !interventions) {
    console.error('Error fetching interventions:', interventionsError);
    return { interventions: [], recentInterventions: new Set(), fromCache: false };
  }

  // Get user's recent intervention history
  const { data: history, error: historyError } = await supabaseClient
    .from('user_intervention_history')
    .select('intervention_id, triggered_at')
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false });

  const recentInterventions = new Set<string>();
  if (!historyError && history) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    history.forEach((h: any) => {
      const triggerTime = new Date(h.triggered_at).getTime();
      if (triggerTime > sevenDaysAgo) {
        recentInterventions.add(h.intervention_id);
      }
    });
  }

  // Filter available interventions
  const availableInterventions = interventions.filter(
    (intervention: any) => !recentInterventions.has(intervention.id)
  );

  const result = { 
    interventions: availableInterventions, 
    recentInterventions 
  };
  
  setCache(cacheKey, result, CACHE_TTL.INTERVENTIONS);
  
  console.log('📥 Loaded interventions:', {
    total: interventions.length,
    available: availableInterventions.length,
    recent: recentInterventions.size
  });

  return { ...result, fromCache: false };
}

/**
 * Enhanced AI response caching for similar queries with fuzzy matching
 */
async function getCachedAIResponse(
  messageContent: string,
  contextLength: number,
  azureApiKey: string,
  azureEndpoint: string,
  systemPrompt: string,
  messages: any[]
): Promise<{ response: string | null; fromCache: boolean; similarity?: number }> {
  
  // Normalize message for better similarity detection
  const normalizedMessage = messageContent.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Create primary cache key
  const contentHash = createContentHash(normalizedMessage + systemPrompt);
  const primaryCacheKey = createCacheKey('ai_response', contentHash, Math.floor(contextLength / 100));
  
  // Try exact match first
  const exactMatch = getCached<string>(primaryCacheKey);
  if (exactMatch) {
    console.log('✅ Using exact cached AI response');
    return { response: exactMatch, fromCache: true, similarity: 1.0 };
  }

  // Try fuzzy matching for similar queries
  const messageLengthBucket = Math.floor(normalizedMessage.length / 20) * 20; // Group by length
  const fuzzySearchKey = createCacheKey('ai_response', '*', Math.floor(contextLength / 100));
  
  // Check all cache entries for similar messages
  for (const [key, entry] of globalCache.entries()) {
    if (!key.startsWith('ai_response') || Date.now() >= entry.expiresAt) continue;
    
    // Skip if stored message metadata is available and lengths are very different
    const storedData = entry.data;
    if (typeof storedData === 'object' && storedData.originalMessage) {
      const lengthDiff = Math.abs(storedData.originalMessage.length - normalizedMessage.length);
      if (lengthDiff > normalizedMessage.length * 0.5) continue; // Skip if 50%+ length difference
      
      // Calculate simple similarity score
      const similarity = calculateMessageSimilarity(normalizedMessage, storedData.originalMessage);
      if (similarity >= 0.8) { // 80% similarity threshold
        console.log(`✅ Using similar cached AI response (${(similarity * 100).toFixed(1)}% match)`);
        return { 
          response: storedData.response || storedData, 
          fromCache: true, 
          similarity 
        };
      }
    }
  }

  console.log('🔄 No similar cached response found');
  return { response: null, fromCache: false };
}

/**
 * Calculate similarity between two normalized messages
 */
function calculateMessageSimilarity(msg1: string, msg2: string): number {
  const words1 = new Set(msg1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(msg2.split(' ').filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Cache an AI response for future similar queries with metadata
 */
function cacheAIResponse(
  messageContent: string,
  contextLength: number,
  systemPrompt: string,
  response: string
): void {
  // Normalize message for similarity matching
  const normalizedMessage = messageContent.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  const contentHash = createContentHash(normalizedMessage + systemPrompt);
  const cacheKey = createCacheKey('ai_response', contentHash, Math.floor(contextLength / 100));
  
  // Store with metadata for similarity matching
  const cacheData = {
    response,
    originalMessage: normalizedMessage,
    messageLength: normalizedMessage.length,
    contextLength,
    timestamp: Date.now(),
  };
  
  setCache(cacheKey, cacheData, CACHE_TTL.AI_RESPONSES);
  console.log('💾 Cached AI response with metadata for similarity matching');
}

/**
 * Enhanced session data with caching
 */
async function getCachedSessionData(
  userId: string,
  supabaseClient: any
): Promise<{ sessionData: any | null; fromCache: boolean }> {
  const cacheKey = createCacheKey('session_data', userId);
  
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return { sessionData: cached, fromCache: true };
  }

  console.log('🔄 Cache MISS: Fetching fresh session data for user:', userId);

  const { data, error } = await supabaseClient
    .from('user_message_counters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching session data:', error);
    return { sessionData: null, fromCache: false };
  }

  if (data) {
    setCache(cacheKey, data, CACHE_TTL.SESSION_DATA);
  }

  return { sessionData: data, fromCache: false };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== MONEY COACH CHAT FUNCTION STARTED ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Supabase client created successfully');

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { message, conversationHistory = [], stream: streamRequested = false } = await req.json();
    const RECENT_MESSAGE_LIMIT = 6; // Reduced from 12 for faster processing
    const recentHistory = conversationHistory.slice(-RECENT_MESSAGE_LIMIT);
    console.log('Received message:', message?.substring(0, 100) + '...');
    console.log('Conversation history length:', conversationHistory.length);

    // Get API keys
    const mem0ApiKey = Deno.env.get('MEM0_API_KEY');
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    console.log('API keys status:', {
      mem0: mem0ApiKey ? 'available' : 'missing',
      azure: azureApiKey ? 'available' : 'missing',
      azureEndpoint: azureEndpoint ? 'available' : 'missing'
    });

    if (!azureApiKey || !azureEndpoint) {
      console.error('Required Azure API keys not configured');
      throw new Error('Required Azure API keys not configured');
    }

    // NEW: Check if user is in intervention consent state
    const { isInConsentState, pendingIntervention, reason: pendingReason, focusArea: pendingFocusArea } = await checkInterventionConsentState(
      user.id, 
      supabaseClient
    );

    if (isInConsentState && pendingIntervention) {
      console.log('=== USER IS IN INTERVENTION CONSENT STATE ===');
      console.log('Pending intervention:', pendingIntervention.name);
      
      // Check if this is a consent response
      const { isConsentResponse, isYes, isNo } = detectInterventionConsent(message);
      
      if (isConsentResponse) {
        console.log('=== CONSENT RESPONSE DETECTED ===');
        console.log('User response:', { isYes, isNo });
        
        // Clear the consent state regardless of response
        await clearInterventionConsentState(user.id, supabaseClient);
        
        if (isYes) {
          console.log('=== USER CONSENTED - STARTING INTERVENTION ===');
          
          // Start the intervention immediately
          return new Response(
            JSON.stringify({ 
              intervention: pendingIntervention,
              success: true,
              trigger_reason: 'intake_based_with_consent',
              consent_given: true,
              session_info: {
                session_id: crypto.randomUUID(), // Generate new session for intervention
                is_new_session: false
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('=== USER DECLINED INTERVENTION ===');
          
          // Generate a supportive response and continue normal chat
          const systemPrompt = `You are a warm, empathetic money coach. The user just declined to do a guided reflection exercise that you offered. Respond supportively and naturally continue the conversation without mentioning the declined intervention again. Show that you respect their choice and are still here to help in whatever way feels right for them.

Recent conversation context:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

          const response = await fetch(`${azureEndpoint}/openai/deployments/${SIDE_DEPLOYMENT}/chat/completions?api-version=2024-04-01-preview`, {
            method: 'POST',
            headers: {
              'api-key': azureApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: SIDE_MODEL,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              max_tokens: 400,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate supportive response');
          }

          const data = await response.json();
          const supportiveMessage = data.choices[0].message.content;

          return new Response(
            JSON.stringify({ 
              message: supportiveMessage,
              success: true,
              intervention_declined: true,
              session_info: {
                session_id: crypto.randomUUID(),
                is_new_session: false
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('=== NOT A CONSENT RESPONSE - ASKING AGAIN ===');
        
        // This is not a clear yes/no response, ask for clarification
        const clarificationMessage = `I'm not sure if you'd like to try the "${pendingIntervention.name}" reflection exercise or not. It could help with ${pendingFocusArea.toLowerCase()}. 

Would you like to give it a try? Just let me know "yes" if you're interested, or "no" if you'd prefer to continue our conversation as we are.`;

        return new Response(
          JSON.stringify({ 
            message: clarificationMessage,
            success: true,
            awaiting_consent: true,
            pending_intervention: {
              name: pendingIntervention.name,
              description: pendingIntervention.description
            },
            session_info: {
              session_id: crypto.randomUUID(),
              is_new_session: false
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }



    // Continue with normal session-aware intervention plan
    console.log('=== SESSION-AWARE INTERVENTION PLAN ===');

    // STEP 1: Detect session boundary
    const { isNewSession, sessionId, reason: sessionReason } = await detectSessionBoundary(
      user.id, 
      message, 
      supabaseClient
    );
    
    console.log('Session detection:', { isNewSession, sessionId, sessionReason });

    // Initialize intervention variables
    let interventionData = null;
    let triggerReason = '';
    
    // STEP 2: Check for immediate distress (ALWAYS check - emergency triggers override everything)
    const { hasDistress, keywords: distressKeywords } = checkForDistressKeywords(message);

    if (hasDistress) {
      console.log('=== IMMEDIATE DISTRESS DETECTED ===');
      console.log('Distress keywords found:', distressKeywords);
      
      // Immediate intervention for distress (using cached context)
      const conversationContext = `${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\nUser: ${message}`;
      
      // Use cached user context for distress interventions
      const { userContext, fromCache: contextFromCache } = await getCachedUserContext(
        user.id,
        message,
        supabaseClient,
        mem0ApiKey || ''
      );
      
      const { intervention, triggered } = await selectInterventionWithMem0Context(
        user.id,
        'immediate_distress',
        'emotional_distress',
        conversationContext,
        distressKeywords,
        supabaseClient,
        mem0ApiKey || '',
        azureApiKey,
        azureEndpoint
      );
      
      console.log('🚀 Context cache performance:', { contextFromCache });
      
      if (triggered && intervention) {
        interventionData = intervention;
        triggerReason = 'immediate_distress';
        console.log('Immediate distress intervention triggered:', intervention.name);
      }
    } else {
      // STEP 3: Update session-aware message counter
      const { shouldAnalyze, messageCount, shouldCheckIntake, messagesSinceIntervention, sessionMessageCount } = await updateSessionAwareMessageCounter(
        user.id, 
        sessionId, 
        isNewSession, 
        supabaseClient
      );

      // OPTIMIZATION: Skip intervention analysis for very short/casual messages IF:
      // - Not first few messages (where we want to build rapport)
      // - Not in established conversation (where patterns matter)
      const messageWords = message.trim().split(/\s+/).length;
      const shouldSkipNonUrgentAnalysis = (
        messageWords < 3 && // Very short (1-2 words)
        conversationHistory.length > 5 && // Not early conversation
        !shouldCheckIntake // Not due for intake check
      );
      
      if (shouldCheckIntake && !shouldSkipNonUrgentAnalysis) {
        console.log('=== INTAKE-BASED INTERVENTION CHECK ===');
        console.log(`${messagesSinceIntervention} messages since last intervention - checking intake responses`);
        
        const conversationContext = `${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\nUser: ${message}`;
        const { shouldOffer, reason, suggestedFocus } = await analyzeIntakeForIntervention(
          user.id,
          conversationContext,
          supabaseClient,
          azureApiKey,
          azureEndpoint
        );
        
        if (shouldOffer) {
          console.log('=== INTAKE-BASED INTERVENTION OPPORTUNITY DETECTED ===');
          console.log('Reason:', reason, 'Focus:', suggestedFocus);
          
          // Instead of immediately triggering, select intervention and ask for consent
          const { intervention, triggered } = await selectInterventionWithMem0Context(
            user.id,
            'intake_based',
            'past_issues',
            conversationContext,
            [],
            supabaseClient,
            mem0ApiKey || '',
            azureApiKey,
            azureEndpoint,
            suggestedFocus
          );
          
          if (triggered && intervention) {
            console.log('=== SETTING UP INTERVENTION CONSENT REQUEST ===');
            console.log('Intervention selected:', intervention.name);
            
            // Set the consent state
            await setInterventionConsentState(
              user.id,
              intervention.id,
              'intake_based',
              suggestedFocus,
              supabaseClient
            );
            
            // Generate a consent request message
            const consentMessage = `I notice that based on our previous conversations and what you shared in your initial assessment, this might be a good time to explore ${suggestedFocus.toLowerCase()}. 

I have a guided reflection exercise called "${intervention.name}" that could help with this. ${intervention.description}

Would you like to try this reflection exercise, or would you prefer to continue our conversation as we are?`;

            return new Response(
              JSON.stringify({ 
                message: consentMessage,
                success: true,
                consent_request: true,
                intervention_preview: {
                  name: intervention.name,
                  description: intervention.description,
                  focus_area: suggestedFocus
                },
                session_info: {
                  session_id: sessionId,
                  is_new_session: isNewSession,
                  session_reason: sessionReason
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.log('=== INTAKE CHECK COMPLETED - NO INTERVENTION NEEDED ===');
          console.log('Reason:', reason);
        }
      } else if (shouldAnalyze && !shouldSkipNonUrgentAnalysis) {
        console.log('=== SESSION-BASED 5-MESSAGE ANALYSIS TRIGGERED ===');
        console.log(`Session message count: ${sessionMessageCount} - performing analysis`);
        
        // STEP 4: Perform simplified 3-level analysis
        const { needLevel, reason, category } = await performSimplifiedConversationAnalysis(
          message,
          conversationHistory,
          azureApiKey,
          azureEndpoint
        );
        
        console.log('Analysis result:', { needLevel, reason, category });
        
        // STEP 5: Only offer intervention if HIGH need
        if (needLevel === 'HIGH') {
          console.log('=== HIGH NEED DETECTED - OFFERING INTERVENTION ===');
          
          const conversationContext = `${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\nUser: ${message}`;
          const { intervention, triggered } = await selectInterventionWithMem0Context(
            user.id,
            'high_need_analysis',
            category,
            conversationContext,
            [],
            supabaseClient,
            mem0ApiKey || '',
            azureApiKey,
            azureEndpoint
          );
          
          if (triggered && intervention) {
            interventionData = intervention;
            triggerReason = 'high_need_analysis';
            console.log('High need intervention triggered:', intervention.name);
          }
        } else {
          console.log('=== MEDIUM/LOW NEED - CONTINUING NORMAL CHAT ===');
        }
      } else {
        if (shouldSkipNonUrgentAnalysis) {
          console.log('=== SKIPPING NON-URGENT ANALYSIS ===');
          console.log(`Reason: Very short message (${messageWords} words) in established conversation`);
        } else {
          console.log('=== CONTINUING NORMAL CHAT ===');
          console.log(`Session message ${sessionMessageCount} - not analysis time`);
        }
      }
    }

    // If we triggered an intervention, return it instead of the regular chat response
    if (interventionData) {
      console.log('=== RETURNING INTERVENTION RESPONSE ===');
      return new Response(
        JSON.stringify({ 
          intervention: interventionData,
          success: true,
          trigger_reason: triggerReason,
          distress_keywords: hasDistress ? distressKeywords : [],
          session_info: {
            session_id: sessionId,
            is_new_session: isNewSession,
            session_reason: sessionReason
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Continue with normal chat response using cached context
    console.log('=== CACHED USER CONTEXT RETRIEVAL ===');
    console.log('User ID:', user.id);
    console.log('Search query:', message);

    // Use enhanced cached user context building
    const { 
      userContext, 
      contextSource, 
      mem0MemoryCount, 
      fromCache: contextFromCache 
    } = await getCachedUserContext(
      user.id,
      message,
      supabaseClient,
      mem0ApiKey || ''
    );

    // Legacy variables for backward compatibility with existing code
    const mem0SearchResults = mem0MemoryCount;
    const mem0RetrievalSuccess = mem0MemoryCount;
    const mem0RetrievalFailed = 0;

    console.log('🚀 Context retrieval performance:', {
      contextFromCache,
      contextSource,
      contextLength: userContext.length,
      memoryCount: mem0MemoryCount
    });

    // Compressed system prompt for faster processing
    const systemPrompt = `You are a warm, empathetic money coach. Speak like a caring friend with expertise in money psychology. Use conversational language, validate feelings, ask natural follow-up questions, and share gentle observations using "I notice..." or "It sounds like...". 

${userContext || 'This person is just starting to share their money story. Create a safe space for them.'}

Remember: Connect with the whole human, explore emotional roots of money issues with compassion, and sometimes just listening is most healing. Be present and genuine.`;

    const cleanedHistory = recentHistory.map((msg: any) => ({
      role: msg.role,
      content: (msg.content || '').replace(/\s+/g, ' ').trim()
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...cleanedHistory,
      { role: 'user', content: message.trim() }
    ];

    console.log('=== AZURE OPENAI REQUEST ===');
    console.log('Context source:', contextSource);
    console.log('Context length:', userContext.length);
    console.log('Mem0 search results:', mem0SearchResults);
    console.log('Mem0 successful retrievals:', mem0RetrievalSuccess);
    console.log('Mem0 failed retrievals:', mem0RetrievalFailed);
    console.log('Final memory count used:', mem0MemoryCount);

    // Try to get cached AI response for similar queries (non-streaming only)
    let cachedAssistantMessage = '';
    let aiResponseFromCache = false;
    
    if (!streamRequested) {
      const { response: cachedResponse, fromCache } = await getCachedAIResponse(
        message,
        userContext.length,
        azureApiKey,
        azureEndpoint,
        systemPrompt,
        messages
      );
      
      if (cachedResponse) {
        cachedAssistantMessage = cachedResponse;
        aiResponseFromCache = true;
        console.log('✅ Using cached AI response for similar query');
        
        // Skip Azure OpenAI call and go directly to response
        console.log('=== RESPONSE FROM CACHE ===');
        console.log('Response length:', cachedAssistantMessage.length);
        
        return new Response(
          JSON.stringify({ 
            message: cachedAssistantMessage,
            success: true,
            context_used: userContext.length > 0,
            context_source: contextSource,
            mem0_memory_count: mem0MemoryCount,
            context_length: userContext.length,
            mem0_search_results: mem0SearchResults,
            mem0_retrieval_success: mem0RetrievalSuccess,
            mem0_retrieval_failed: mem0RetrievalFailed,
            ai_response_cached: true,
            context_cached: contextFromCache,
            session_info: {
              session_id: sessionId,
              is_new_session: isNewSession,
              session_reason: sessionReason
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Call Azure OpenAI with correct model deployment name
    const openAIResponse = await fetch(`${azureEndpoint}/openai/deployments/gpt-4.1/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        ...(streamRequested ? { stream: true } : {}),
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`Azure OpenAI API error: ${openAIResponse.status} ${errorText}`);
    }

    // --- STREAMING PATH -------------------------------------------------
    if (streamRequested) {
      const decoder = new TextDecoder();
      let assistantMessage = '';

      const azureStream = openAIResponse.body!;

      const proxyStream = new ReadableStream({
        async start(controller) {
          const reader = azureStream.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              // Forward raw bytes to client
              controller.enqueue(value);

              // Decode chunk to accumulate assistant message
              const chunkText = decoder.decode(value);
              const lines = chunkText.split('\n');
              for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith('data:')) continue;
                const dataStr = line.slice(5).trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const json = JSON.parse(dataStr);
                  const token = json?.choices?.[0]?.delta?.content;
                  if (token) assistantMessage += token;
                } catch (_) {/* ignore malformed JSON */}
              }
            }

            // After stream finished, run memory analysis & commitment (non-blocking for client)
            try {
              const conversationContext = `User: ${message}\nAssistant: ${assistantMessage}`;
              // Kick off memory analysis & commitment in background (non-blocking)
              queueMicrotask(() => {
                (async () => {
                  try {
                    const memAnalysis = await analyzeConversationForMemory(
                      message,
                      assistantMessage,
                      conversationHistory,
                      azureApiKey,
                      azureEndpoint
                    );

                    if (memAnalysis.shouldCommit && memAnalysis.insights.length > 0 && mem0ApiKey && mem0ApiKey.trim() !== '') {
                      await commitInsightsToMem0(
                        memAnalysis.insights,
                        memAnalysis.categories,
                        user.id,
                        mem0ApiKey,
                        conversationContext
                      );
                    }
                  } catch (bgErr) {
                    console.error('Background memory analysis error:', bgErr);
                  }
                })();
              });
            } catch (postErr) {
              console.error('Post-stream memory processing error:', postErr);
            }

          } finally {
            controller.close();
          }
        }
      });

      return new Response(proxyStream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
    }

    // --- NON-STREAM PATH ------------------------------------------------
    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    console.log('=== AZURE OPENAI RESPONSE RECEIVED ===');
    console.log('Response length:', assistantMessage.length);

    // Cache the AI response for future similar queries
    cacheAIResponse(message, userContext.length, systemPrompt, assistantMessage);

    // Kick off memory analysis & commitment in background (non-blocking)
    const conversationContext = `User: ${message}\nAssistant: ${assistantMessage}`;
    queueMicrotask(() => {
      (async () => {
        try {
          const memAnalysis = await analyzeConversationForMemory(
            message,
            assistantMessage,
            conversationHistory,
            azureApiKey,
            azureEndpoint
          );

          if (memAnalysis.shouldCommit && memAnalysis.insights.length > 0 && mem0ApiKey && mem0ApiKey.trim() !== '') {
            await commitInsightsToMem0(
              memAnalysis.insights,
              memAnalysis.categories,
              user.id,
              mem0ApiKey,
              conversationContext
            );
          }
        } catch (bgErr) {
          console.error('Background memory analysis error:', bgErr);
        }
      })();
    });

    console.log('=== RESPONSE GENERATED SUCCESSFULLY ===');
    console.log('Intervention system: SESSION-AWARE PLAN WITH CONSENT');
    console.log('Session info:', { isNewSession, sessionId, sessionReason });
    console.log('Distress check:', { hasDistress, distressKeywords });
    console.log('Final context source:', contextSource);
    console.log('Context was available:', userContext.length > 0);

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true,
        context_used: userContext.length > 0,
        context_source: contextSource,
        mem0_memory_count: mem0MemoryCount,
        context_length: userContext.length,
        mem0_search_results: mem0SearchResults,
        mem0_retrieval_success: mem0RetrievalSuccess,
        mem0_retrieval_failed: mem0RetrievalFailed,
        // Memory analysis & commitment now run in background; placeholder values
        memory_analysis: {
          should_commit: false,
          insights_found: 0,
          categories: []
        },
        memory_commitment: {
          attempted: false,
          successful: false,
          memories_created: 0
        },
        intervention_system: {
          plan: 'SESSION_AWARE_WITH_CONSENT',
          session_info: { isNewSession, sessionId, sessionReason },
          distress_check: { hasDistress, keywords: distressKeywords },
          trigger_reason: triggerReason || 'none'
        },
        session_info: {
          session_id: sessionId,
          is_new_session: isNewSession,
          session_reason: sessionReason
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in money-coach-chat function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred in the money coach chat function. Please check the logs for more details.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});