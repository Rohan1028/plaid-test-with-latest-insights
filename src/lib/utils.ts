import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Session ID generator with fallback for intervention session management
export const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

// ============================================================================
// TIMEZONE OPTIMIZATION UTILITIES
// ============================================================================

// Global timezone formatter to avoid repeated timezone lookups
export const globalTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC' // Use UTC consistently to avoid expensive timezone operations
});

export const globalDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
});

/**
 * Optimized timestamp formatting to avoid expensive timezone database operations
 */
export function formatTimestampOptimized(timestamp: Date | string): string {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return globalTimeFormatter.format(date);
  } catch (error) {
    // Fallback to simple formatting if timezone operations fail
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Batch timestamp formatting to reduce timezone operations
 */
export function formatMessageTimestamps(messages: any[]): any[] {
  return messages.map(msg => ({
    ...msg,
    formattedTime: formatTimestampOptimized(msg.created_at || msg.timestamp),
    timestamp: new Date(msg.created_at || msg.timestamp)
  }));
}

// ============================================================================
// DATABASE QUERY OPTIMIZATION
// ============================================================================

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  queryHash: string;
}

interface QueryBatch {
  queries: Array<{
    id: string;
    tableName: string;
    conditions: Record<string, any>;
    select?: string;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
  }>;
  timestamp: number;
}

// Global query cache (persists across component renders)
const queryCache = new Map<string, QueryCacheEntry>();
const queryBatches = new Map<string, QueryBatch>();

// Cache configuration
const DB_CACHE_TTL = {
  USER_DATA: 5 * 60 * 1000,      // 5 minutes - user profiles, preferences
  CHAT_MESSAGES: 2 * 60 * 1000,   // 2 minutes - recent chat messages
  INTERVENTIONS: 10 * 60 * 1000,  // 10 minutes - intervention data
  STATIC_DATA: 30 * 60 * 1000,    // 30 minutes - static reference data
  SESSION_DATA: 15 * 60 * 1000,   // 15 minutes - session information
};

const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 10,
  BATCH_DELAY: 50, // milliseconds
  MAX_WAIT_TIME: 200, // milliseconds
};

// ============================================================================
// QUERY PERFORMANCE MONITORING
// ============================================================================

export const queryPerformanceMonitor = {
  logSlowQueries: true,
  slowQueryThreshold: 100, // ms
  
  async trackQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      
      if (duration > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
      } else {
        console.log(`⚡ Fast query: ${queryName} completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
};

// ============================================================================
// DATABASE CONNECTION OPTIMIZATION
// ============================================================================

export class DatabaseOptimizer {
  private static queryQueue: Map<string, Promise<any>> = new Map();
  
  static async optimizedQuery(key: string, queryFn: () => Promise<any>) {
    // Deduplicate identical concurrent queries
    if (this.queryQueue.has(key)) {
      console.log('🔄 Deduplicating concurrent query:', key);
      return await this.queryQueue.get(key);
    }
    
    const queryPromise = queryFn();
    this.queryQueue.set(key, queryPromise);
    
    try {
      const result = await queryPromise;
      return result;
    } finally {
      this.queryQueue.delete(key);
    }
  }
}

/**
 * Create a hash from query parameters for caching
 */
function createQueryHash(tableName: string, conditions: any, select?: string, orderBy?: any, limit?: number): string {
  const queryObj = { tableName, conditions, select, orderBy, limit };
  const queryString = JSON.stringify(queryObj, Object.keys(queryObj).sort());
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < queryString.length; i++) {
    const char = queryString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached query result
 */
function getCachedQuery<T>(queryHash: string): T | null {
  try {
    const entry = queryCache.get(queryHash);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      queryCache.delete(queryHash);
      console.log('🕒 Query cache EXPIRED:', queryHash);
      return null;
    }

    console.log('✅ Query cache HIT:', queryHash);
    return entry.data as T;
  } catch (error) {
    console.error('❌ Query cache retrieval error:', error);
    return null;
  }
}

/**
 * Cache query result
 */
function setCachedQuery<T>(queryHash: string, data: T, ttl: number): void {
  try {
    const entry: QueryCacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      queryHash
    };

    queryCache.set(queryHash, entry);
    console.log('💾 Query cached:', queryHash, 'TTL:', Math.round(ttl / 1000), 'seconds');
  } catch (error) {
    console.error('❌ Query cache storage error:', error);
  }
}

/**
 * Invalidate cache entries for a specific table
 */
export function invalidateTableCache(tableName: string): number {
  try {
    const keysToDelete = Array.from(queryCache.keys())
      .filter(key => {
        const entry = queryCache.get(key);
        return entry && key.includes(tableName);
      });
    
    keysToDelete.forEach(key => queryCache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log('🗑️ Invalidated table cache:', tableName, 'Entries:', keysToDelete.length);
    }
    
    return keysToDelete.length;
  } catch (error) {
    console.error('❌ Table cache invalidation error:', error);
    return 0;
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanupQueryCache(): void {
  try {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of queryCache.entries()) {
      if (now >= entry.expiresAt) {
        queryCache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log('🧹 Query cache cleanup:', expiredCount, 'expired entries removed');
    }
  } catch (error) {
    console.error('❌ Query cache cleanup error:', error);
  }
}

/**
 * Enhanced Supabase query with caching and optimization
 */
export async function cachedSupabaseQuery<T>({
  supabaseClient,
  tableName,
  conditions = {},
  select = '*',
  orderBy,
  limit,
  ttl,
  enableCache = true,
}: {
  supabaseClient: any;
  tableName: string;
  conditions?: Record<string, any>;
  select?: string;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  ttl?: number;
  enableCache?: boolean;
}): Promise<{ data: T | null; error: any; fromCache: boolean }> {
  
  const queryHash = createQueryHash(tableName, conditions, select, orderBy, limit);
  
  // Try cache first if enabled
  if (enableCache) {
    const cached = getCachedQuery<T>(queryHash);
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }
  }

  try {
    console.log('🔄 Cache MISS: Executing fresh query for table:', tableName);
    
    // Build the query
    let query = supabaseClient.from(tableName).select(select);
    
    // Apply conditions
    Object.entries(conditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Query error for table ${tableName}:`, error);
      return { data: null, error, fromCache: false };
    }

    // Cache the result if enabled and successful
    if (enableCache && data && ttl) {
      setCachedQuery(queryHash, data, ttl);
    }

    console.log(`📥 Fresh query completed for table ${tableName}:`, data?.length || 'single result');
    return { data, error: null, fromCache: false };

  } catch (error) {
    console.error(`❌ Query exception for table ${tableName}:`, error);
    return { data: null, error, fromCache: false };
  }
}

/**
 * Batch multiple queries for better performance
 */
export async function batchSupabaseQueries(
  supabaseClient: any,
  queries: Array<{
    id: string;
    tableName: string;
    conditions?: Record<string, any>;
    select?: string;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
    ttl?: number;
  }>
): Promise<Record<string, { data: any; error: any; fromCache: boolean }>> {
  
  const results: Record<string, { data: any; error: any; fromCache: boolean }> = {};
  const uncachedQueries: typeof queries = [];
  
  // Check cache for each query first
  for (const query of queries) {
    const queryHash = createQueryHash(
      query.tableName,
      query.conditions || {},
      query.select,
      query.orderBy,
      query.limit
    );
    
    const cached = getCachedQuery(queryHash);
    if (cached) {
      results[query.id] = { data: cached, error: null, fromCache: true };
    } else {
      uncachedQueries.push(query);
    }
  }
  
  // Execute uncached queries in parallel
  if (uncachedQueries.length > 0) {
    console.log('🔄 Executing batch queries:', uncachedQueries.length, 'uncached queries');
    
    const queryPromises = uncachedQueries.map(async (query) => {
      const result = await cachedSupabaseQuery({
        supabaseClient,
        tableName: query.tableName,
        conditions: query.conditions,
        select: query.select,
        orderBy: query.orderBy,
        limit: query.limit,
        ttl: query.ttl || DB_CACHE_TTL.USER_DATA,
        enableCache: true,
      });
      
      return { id: query.id, ...result };
    });
    
    const queryResults = await Promise.allSettled(queryPromises);
    
    queryResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results[result.value.id] = {
          data: result.value.data,
          error: result.value.error,
          fromCache: result.value.fromCache,
        };
      } else {
        console.error('❌ Batch query failed:', result.reason);
      }
    });
  }
  
  console.log('✅ Batch queries completed:', {
    total: queries.length,
    cached: queries.length - uncachedQueries.length,
    fresh: uncachedQueries.length,
  });
  
  return results;
}

/**
 * Optimized chat messages loading with pagination and timezone optimization
 */
export async function loadChatMessagesOptimized({
  supabaseClient,
  userId,
  limit = 50,
  offset = 0,
  sessionId,
}: {
  supabaseClient: any;
  userId: string;
  limit?: number;
  offset?: number;
  sessionId?: string;
}): Promise<{ data: any[] | null; error: any; fromCache: boolean }> {
  
  return await queryPerformanceMonitor.trackQuery(
    `loadChatMessages_${userId}_${limit}${sessionId ? '_session' : ''}`,
    async () => {
      const conditions: Record<string, any> = { user_id: userId };
      if (sessionId) {
        conditions.session_id = sessionId;
      }
      
      const result = await cachedSupabaseQuery({
        supabaseClient,
        tableName: 'chat_messages',
        conditions,
        select: 'id, content, role, created_at, session_id',
        orderBy: { column: 'created_at', ascending: false },
        limit,
        ttl: DB_CACHE_TTL.CHAT_MESSAGES,
      });
      
      // Apply timezone optimizations to the results
      if (result.data && Array.isArray(result.data)) {
        const optimizedData = formatMessageTimestamps(result.data);
        
        // Apply offset manually since Supabase range is more complex
        const finalData = offset > 0 ? optimizedData.slice(offset) : optimizedData;
        
        return {
          data: finalData as any[],
          error: result.error,
          fromCache: result.fromCache
        };
      }
      
      return {
        data: result.data as any[] | null,
        error: result.error,
        fromCache: result.fromCache
      };
    }
  );
}

/**
 * Ultra-optimized chat messages loading with minimal timezone operations
 */
export async function loadChatMessagesUltraOptimized({
  supabaseClient,
  userId,
  limit = 50,
}: {
  supabaseClient: any;
  userId: string;
  limit?: number;
}): Promise<{ data: any[] | null; error: any; fromCache: boolean }> {
  
  const cacheKey = `ultra_chat_${userId}_${limit}`;
  
  return await DatabaseOptimizer.optimizedQuery(cacheKey, async () => {
    return await queryPerformanceMonitor.trackQuery(
      `ultraLoadChatMessages_${userId}`,
      async () => {
        const result = await cachedSupabaseQuery({
          supabaseClient,
          tableName: 'chat_messages',
          conditions: { user_id: userId },
          select: 'id, content, role, created_at, session_id',
          orderBy: { column: 'created_at', ascending: false },
          limit,
          ttl: DB_CACHE_TTL.CHAT_MESSAGES,
        });
        
        // Ultra-fast timezone optimization - batch process all timestamps
        if (result.data && Array.isArray(result.data)) {
          const optimizedData = formatMessageTimestamps(result.data);
          return {
            data: optimizedData as any[],
            error: result.error,
            fromCache: result.fromCache
          };
        }
        
        return {
          data: result.data as any[] | null,
          error: result.error,
          fromCache: result.fromCache
        };
      }
    );
  }) as Promise<{ data: any[] | null; error: any; fromCache: boolean }>;
}

/**
 * Optimized user data loading with relationship caching
 */
export async function loadUserDataOptimized({
  supabaseClient,
  userId,
}: {
  supabaseClient: any;
  userId: string;
}): Promise<{
  profile: any;
  intakeResponses: any[];
  messageCounters: any;
  fromCache: { profile: boolean; intake: boolean; counters: boolean };
}> {
  
  const batchResults = await batchSupabaseQueries(supabaseClient, [
    {
      id: 'profile',
      tableName: 'profiles',
      conditions: { id: userId },
      select: '*',
      ttl: DB_CACHE_TTL.USER_DATA,
    },
    {
      id: 'intake',
      tableName: 'intake_responses',
      conditions: { user_id: userId },
      select: 'question_text, answer, created_at',
      orderBy: { column: 'created_at', ascending: true },
      ttl: DB_CACHE_TTL.USER_DATA,
    },
    {
      id: 'counters',
      tableName: 'user_message_counters',
      conditions: { user_id: userId },
      select: '*',
      ttl: DB_CACHE_TTL.SESSION_DATA,
    },
  ]);
  
  return {
    profile: batchResults.profile?.data?.[0] || null,
    intakeResponses: batchResults.intake?.data || [],
    messageCounters: batchResults.counters?.data?.[0] || null,
    fromCache: {
      profile: batchResults.profile?.fromCache || false,
      intake: batchResults.intake?.fromCache || false,
      counters: batchResults.counters?.fromCache || false,
    },
  };
}

/**
 * Optimized intervention data loading
 */
export async function loadInterventionsOptimized({
  supabaseClient,
  userId,
}: {
  supabaseClient: any;
  userId: string;
}): Promise<{
  availableInterventions: any[];
  userHistory: any[];
  recentInterventions: Set<string>;
  fromCache: { interventions: boolean; history: boolean };
}> {
  
  const batchResults = await batchSupabaseQueries(supabaseClient, [
    {
      id: 'interventions',
      tableName: 'interventions',
      select: '*',
      orderBy: { column: 'created_at', ascending: true },
      ttl: DB_CACHE_TTL.INTERVENTIONS,
    },
    {
      id: 'history',
      tableName: 'user_intervention_history',
      conditions: { user_id: userId },
      select: 'intervention_id, triggered_at',
      orderBy: { column: 'triggered_at', ascending: false },
      ttl: DB_CACHE_TTL.USER_DATA,
    },
  ]);
  
  const interventions = batchResults.interventions?.data || [];
  const history = batchResults.history?.data || [];
  
  // Calculate recent interventions (last 7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentInterventions = new Set<string>();
  
  history.forEach((h: any) => {
    const triggerTime = new Date(h.triggered_at).getTime();
    if (triggerTime > sevenDaysAgo) {
      recentInterventions.add(h.intervention_id);
    }
  });
  
  // Filter available interventions
  const availableInterventions = interventions.filter(
    (intervention: any) => !recentInterventions.has(intervention.id)
  );
  
  return {
    availableInterventions,
    userHistory: history,
    recentInterventions,
    fromCache: {
      interventions: batchResults.interventions?.fromCache || false,
      history: batchResults.history?.fromCache || false,
    },
  };
}

// Set up periodic cache cleanup (runs every 5 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

export function maybeCleanupQueryCache(): void {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupQueryCache();
    lastCleanup = now;
    
    // Log cache stats
    console.log('📊 Query Cache Stats:', {
      size: queryCache.size,
      lastCleanup: new Date(lastCleanup).toISOString(),
    });
  }
}
