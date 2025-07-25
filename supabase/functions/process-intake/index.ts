import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { answers, version = 2 } = await req.json(); // Default to v2 (new questions)
    console.log('Processing intake responses for user:', user.id, 'Version:', version);

    // Create intake session with version tracking
    const { data: session, error: sessionError } = await supabaseClient
      .from('intake_sessions')
      .insert([{
        user_id: user.id,
        version: version
      }])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating intake session:', sessionError);
      throw sessionError;
    }

    console.log('Created intake session:', session.id, 'with version:', version);

    // Save individual responses
    const responses = [];
    for (const [key, value] of Object.entries(answers)) {
      const response = {
        session_id: session.id,
        user_id: user.id,
        question_id: key,
        question_text: getQuestionText(key, version),
        answer: value
      };
      responses.push(response);
    }

    const { error: responsesError } = await supabaseClient
      .from('intake_responses')
      .insert(responses);

    if (responsesError) {
      console.error('Error saving responses:', responsesError);
      throw responsesError;
    }

    console.log('Saved responses to database');

    // Mark session as completed first for immediate response
    const { error: updateError } = await supabaseClient
      .from('intake_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session completion:', updateError);
      throw updateError;
    }

    // Start processing a few key memories immediately for quick personalization
    const mem0ApiKey = Deno.env.get('MEM0_API_KEY');
    let quickMemories = [];
    
    if (mem0ApiKey) {
      // Process just the most important memories first for immediate chat personalization
      quickMemories = formatQuickMemoriesForMem0(answers, user, version);
      console.log('Processing', quickMemories.length, 'priority memories for immediate chat personalization');
      
      // Process first 2-3 memories immediately
      for (let i = 0; i < Math.min(3, quickMemories.length); i++) {
        try {
          await processSingleMemory(quickMemories[i], user.id, session.id, mem0ApiKey);
        } catch (error) {
          console.warn('Failed to process priority memory:', error);
        }
      }
    }

    // Return success immediately while processing continues in background
    const response = new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      version: version,
      processing_status: 'immediate_memories_processed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    // Use background processing for remaining Mem0 operations
    if (mem0ApiKey) {
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(processRemainingMemories(answers, user, session, mem0ApiKey, supabaseClient, quickMemories, version));
    }

    return response;

  } catch (error) {
    console.error('Error in process-intake function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processSingleMemory(memoryText, userId, sessionId, apiKey) {
  const payload = {
    messages: [{ role: "user", content: memoryText }],
    user_id: userId,
    metadata: {
      type: "intake_session",
      session_id: sessionId,
      timestamp: new Date().toISOString()
    }
  };

  const response = await fetch('https://api.mem0.ai/v1/memories/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mem0 API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Memory processed successfully:', data.id || 'response received');
  return data;
}

async function processRemainingMemories(answers, user, session, mem0ApiKey, supabaseClient, quickMemories, version) {
  console.log('Starting background processing of remaining memories');
  
  try {
    // Format all memories for Mem0
    const allMemories = formatMemoriesForMem0(answers, user, version);
    // Filter out memories already processed
    const remainingMemories = allMemories.filter(memory => !quickMemories.includes(memory));
    console.log('Processing', remainingMemories.length, 'remaining memories in background');

    // Process remaining memories
    let successCount = 0;
    for (const memoryText of remainingMemories) {
      try {
        await processSingleMemory(memoryText, user.id, session.id, mem0ApiKey);
        successCount++;
      } catch (error) {
        console.error('Failed to process memory:', error);
      }
    }

    // Update session with final Mem0 status
    const { error: finalUpdateError } = await supabaseClient
      .from('intake_sessions')
      .update({ mem0_committed: successCount > 0 })
      .eq('id', session.id);

    if (finalUpdateError) {
      console.error('Error updating final session status:', finalUpdateError);
    }

    console.log(`Background processing complete: ${successCount}/${remainingMemories.length} memories processed`);
  } catch (error) {
    console.error('Background processing failed:', error);
  }
}

function formatQuickMemoriesForMem0(answers, user, version = 2) {
  const memories = [];
  
  // Add user context first
  memories.push(`User profile: ${user.email}, Full name: ${user.user_metadata?.full_name || 'Not provided'}, User ID: ${user.id}`);

  // Get priority questions based on version
  const priorityQuestions = getPriorityQuestions(version);
  
  for (const questionId of priorityQuestions) {
    if (answers[questionId]) {
      const memoryText = `${getQuestionText(questionId, version)} - ${answers[questionId]}`;
      memories.push(memoryText);
    }
  }
  
  return memories;
}

function getPriorityQuestions(version = 2) {
  if (version === 1) {
    // V1 priority questions (old system)
    return ['earliest_memory', 'healing_vision', 'aspirations'];
  } else {
    // V2 priority questions (new system)
    return ['childhood_money_story', 'money_goals', 'parental_money_talk'];
  }
}

function getQuestionText(questionId, version = 2) {
  if (version === 1) {
    // V1 Question mappings (original questions)
    const v1QuestionMap = {
      'earliest_memory': "What is your earliest money memory from childhood?",
      'parents_attitudes': "What were your parents' attitudes and discussions about money?",
      'aspirations': "What are your aspirations regarding finances?",
      'healing_vision': "What does healing your relationship with money feel like and look like to you?",
      'frequency_situations': "How frequently do you find yourself in these situations?",
      'relate_scenarios': "How much do you relate to these scenarios?",
      'life_situations': "How frequently do these situations occur in your life?"
    };
    
    // Handle sub-questions for V1
    if (questionId.includes('_')) {
      const parts = questionId.split('_');
      const baseQuestion = parts.slice(0, -1).join('_');
      return v1QuestionMap[baseQuestion] || questionId;
    }
    
    return v1QuestionMap[questionId] || questionId;
  } else {
    // V2 Question mappings (new simplified questions)
    const v2QuestionMap = {
      'bill_payment_timing': "When bills are due, how often do you pay them at the last minute or late?",
      'financial_worry_sharing': "How often do you hold back from sharing financial worries with others?",
      'self_spending_guilt': "How often do you feel bad spending money on yourself, even for things you need?",
      'money_goals': "What are some of your dreams or goals when it comes to money?",
      'parental_money_talk': "As you grew up, how did your parents talk about money?",
      'success_measurement': "How often do you find yourself measuring success by what people earn or own?",
      'childhood_money_story': "If you shared one childhood story about money with us, what would it be?"
    };
    
    return v2QuestionMap[questionId] || questionId;
  }
}

function formatMemoriesForMem0(answers, user, version = 2) {
  const memories = [];
  
  // Add user context
  memories.push(`User profile: ${user.email}, Full name: ${user.user_metadata?.full_name || 'Not provided'}, User ID: ${user.id}`);

  if (version === 1) {
    // V1 memory formatting (original complex system)
    const textQuestions = ['earliest_memory', 'parents_attitudes', 'aspirations', 'healing_vision'];
    
    for (const questionId of textQuestions) {
      if (answers[questionId]) {
        const memoryText = `${getQuestionText(questionId, version)} - ${answers[questionId]}`;
        memories.push(memoryText);
      }
    }

    // Process frequency responses with better context for V1
    const frequencyQuestions = Object.keys(answers).filter(key =>
      key.startsWith('frequency_situations_') || 
      key.startsWith('relate_scenarios_') || 
      key.startsWith('life_situations_')
    );
    
    if (frequencyQuestions.length > 0) {
      const groupedFrequencies = {};
      frequencyQuestions.forEach(key => {
        const baseKey = key.split('_').slice(0, -1).join('_');
        if (!groupedFrequencies[baseKey]) {
          groupedFrequencies[baseKey] = [];
        }
        const index = parseInt(key.split('_').pop() || '0');
        groupedFrequencies[baseKey][index] = `Rating: ${answers[key]}/5`;
      });

      Object.entries(groupedFrequencies).forEach(([baseKey, ratings]) => {
        const memoryText = `${getQuestionText(baseKey, version)} - Responses: ${ratings.filter(Boolean).join(', ')}`;
        memories.push(memoryText);
      });
    }
  } else {
    // V2 memory formatting (new simplified system)
    const textQuestions = ['money_goals', 'parental_money_talk', 'childhood_money_story'];
    const likertQuestions = ['bill_payment_timing', 'financial_worry_sharing', 'self_spending_guilt', 'success_measurement'];
    
    // Process text questions
    for (const questionId of textQuestions) {
      if (answers[questionId]) {
        const memoryText = `${getQuestionText(questionId, version)} - ${answers[questionId]}`;
        memories.push(memoryText);
      }
    }
    
    // Process Likert scale questions with context
    const likertResponses = [];
    for (const questionId of likertQuestions) {
      if (answers[questionId]) {
        likertResponses.push(`${getQuestionText(questionId, version)}: ${answers[questionId]}/5`);
      }
    }
    
    if (likertResponses.length > 0) {
      memories.push(`Financial behavior patterns: ${likertResponses.join(' | ')}`);
    }
  }

  return memories;
}
