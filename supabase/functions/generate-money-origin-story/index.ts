import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  earlyMemories: string[];
  parentalInfluences: string[];
  patterns: string[];
  triggers: string[];
  aspirations: string[];
  growthAreas: string[];
  rawData: {
    mem0: string[];
    intake: any[];
    chatHistory: any[];
    interventions: any[];
  };
}

interface Milestone {
  id: number;
  title: string;
  content: string;
}

// Function to retrieve Mem0 memories for personalization
async function getPersonalizedMemories(userId: string, mem0ApiKey: string): Promise<string[]> {
  try {
    console.log('Fetching Mem0 memories for user:', userId);
    
    const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mem0ApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'money childhood family spending emotions financial goals patterns',
        user_id: userId,
        limit: 15,
        include_content: true
      }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const memories: string[] = [];
      
      if (searchData.memories && Array.isArray(searchData.memories)) {
        searchData.memories.forEach((item: any) => {
          const content = item.memory || item.text || item.content || item.data;
          if (content && typeof content === 'string' && content.trim().length > 10) {
            memories.push(content.trim());
          }
        });
      }
      
      console.log('Retrieved Mem0 memories:', memories.length);
      return memories;
    } else {
      console.error('Mem0 search failed:', searchResponse.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching Mem0 memories:', error);
    return [];
  }
}

// Function to aggregate user data from all sources
async function aggregateUserData(userId: string, supabaseClient: any, mem0ApiKey: string): Promise<UserData> {
  console.log('Aggregating user data for:', userId);
  
  // Fetch data from all sources in parallel
  const [mem0Memories, intakeResponses, chatHistory, interventions] = await Promise.all([
    getPersonalizedMemories(userId, mem0ApiKey),
    
    // Get intake responses
    supabaseClient
      .from('intake_responses')
      .select('question_text, answer')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then((result: any) => result.data || []),
      
    // Get recent chat messages for patterns
    supabaseClient
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('user_id', userId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(50)
      .then((result: any) => result.data || []),
      
    // Get completed interventions
    supabaseClient
      .from('user_intervention_history')
      .select(`
        *, 
        interventions(name, description),
        milestone_completions(response_text, insights_extracted)
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .then((result: any) => result.data || [])
  ]);

  console.log('Data sources retrieved:', {
    mem0: mem0Memories.length,
    intake: intakeResponses.length,
    chat: chatHistory.length,
    interventions: interventions.length
  });

  // Process and categorize the data
  const userData: UserData = {
    earlyMemories: extractEarlyMemories(intakeResponses, mem0Memories),
    parentalInfluences: extractParentalInfluences(intakeResponses, mem0Memories),
    patterns: extractBehavioralPatterns(chatHistory, mem0Memories, interventions),
    triggers: extractEmotionalTriggers(chatHistory, mem0Memories, interventions),
    aspirations: extractFinancialGoals(intakeResponses, mem0Memories, interventions),
    growthAreas: extractGrowthOpportunities(interventions, mem0Memories),
    rawData: {
      mem0: mem0Memories,
      intake: intakeResponses,
      chatHistory: chatHistory,
      interventions: interventions
    }
  };

  return userData;
}

// Helper functions to extract specific types of insights
function extractEarlyMemories(intakeResponses: any[], mem0Memories: string[]): string[] {
  const memories: string[] = [];
  
  // Look for early memory responses in intake (both V1 and V2)
  intakeResponses.forEach(response => {
    if (response.question_text?.toLowerCase().includes('earliest') || 
        response.question_text?.toLowerCase().includes('childhood') ||
        response.question_text?.toLowerCase().includes('childhood story about money') ||
        response.question_id === 'childhood_money_story' ||
        response.question_id === 'earliest_memory') {
      memories.push(response.answer);
    }
  });
  
  // Look for childhood patterns in Mem0
  mem0Memories.forEach(memory => {
    if (memory.toLowerCase().includes('childhood') || 
        memory.toLowerCase().includes('family') ||
        memory.toLowerCase().includes('parents') ||
        memory.toLowerCase().includes('early')) {
      memories.push(memory);
    }
  });
  
  return memories.slice(0, 3); // Limit to most relevant
}

function extractParentalInfluences(intakeResponses: any[], mem0Memories: string[]): string[] {
  const influences: string[] = [];
  
  // Handle both V1 and V2 parental questions
  intakeResponses.forEach(response => {
    if (response.question_text?.toLowerCase().includes('parents') || 
        response.question_text?.toLowerCase().includes('family') ||
        response.question_text?.toLowerCase().includes('how did your parents talk about money') ||
        response.question_id === 'parental_money_talk' ||
        response.question_id === 'parents_attitudes') {
      influences.push(response.answer);
    }
  });
  
  mem0Memories.forEach(memory => {
    if (memory.toLowerCase().includes('parents') || 
        memory.toLowerCase().includes('family') ||
        memory.toLowerCase().includes('mother') ||
        memory.toLowerCase().includes('father')) {
      influences.push(memory);
    }
  });
  
  return influences.slice(0, 3);
}

function extractBehavioralPatterns(chatHistory: any[], mem0Memories: string[], interventions: any[]): string[] {
  const patterns: string[] = [];
  
  // Look for spending patterns in chat
  chatHistory.forEach(message => {
    if (message.content?.toLowerCase().includes('spend') || 
        message.content?.toLowerCase().includes('buy') ||
        message.content?.toLowerCase().includes('save') ||
        message.content?.toLowerCase().includes('money')) {
      patterns.push(message.content);
    }
  });
  
  // Extract patterns from Mem0 (including V2 Likert scale insights)
  mem0Memories.forEach(memory => {
    if (memory.toLowerCase().includes('pattern') || 
        memory.toLowerCase().includes('habit') ||
        memory.toLowerCase().includes('always') ||
        memory.toLowerCase().includes('tend to') ||
        memory.toLowerCase().includes('financial behavior patterns') ||
        memory.toLowerCase().includes('bill payment') ||
        memory.toLowerCase().includes('spending guilt') ||
        memory.toLowerCase().includes('success by what people earn')) {
      patterns.push(memory);
    }
  });
  
  return patterns.slice(0, 4);
}

function extractEmotionalTriggers(chatHistory: any[], mem0Memories: string[], interventions: any[]): string[] {
  const triggers: string[] = [];
  
  const emotionWords = ['anxious', 'stress', 'worry', 'fear', 'panic', 'shame', 'guilt', 'relief', 'happy', 'sad'];
  
  chatHistory.forEach(message => {
    if (emotionWords.some(emotion => message.content?.toLowerCase().includes(emotion))) {
      triggers.push(message.content);
    }
  });
  
  // Enhanced Mem0 search including V2 emotional patterns
  mem0Memories.forEach(memory => {
    if (emotionWords.some(emotion => memory.toLowerCase().includes(emotion)) ||
        memory.toLowerCase().includes('hold back from sharing financial worries') ||
        memory.toLowerCase().includes('feel bad spending money on yourself') ||
        memory.toLowerCase().includes('financial worry') ||
        memory.toLowerCase().includes('spending guilt')) {
      triggers.push(memory);
    }
  });
  
  return triggers.slice(0, 3);
}

function extractFinancialGoals(intakeResponses: any[], mem0Memories: string[], interventions: any[]): string[] {
  const goals: string[] = [];
  
  // Handle both V1 and V2 goals/aspirations questions
  intakeResponses.forEach(response => {
    if (response.question_text?.toLowerCase().includes('aspiration') || 
        response.question_text?.toLowerCase().includes('goal') ||
        response.question_text?.toLowerCase().includes('want') ||
        response.question_text?.toLowerCase().includes('dreams or goals when it comes to money') ||
        response.question_id === 'money_goals' ||
        response.question_id === 'aspirations') {
      goals.push(response.answer);
    }
  });
  
  mem0Memories.forEach(memory => {
    if (memory.toLowerCase().includes('goal') || 
        memory.toLowerCase().includes('want') ||
        memory.toLowerCase().includes('hope') ||
        memory.toLowerCase().includes('dream')) {
      goals.push(memory);
    }
  });
  
  return goals.slice(0, 3);
}

function extractGrowthOpportunities(interventions: any[], mem0Memories: string[]): string[] {
  const growth: string[] = [];
  
  interventions.forEach(intervention => {
    if (intervention.milestone_completions) {
      intervention.milestone_completions.forEach((completion: any) => {
        if (completion.insights_extracted) {
          growth.push(...completion.insights_extracted);
        }
        if (completion.response_text) {
          growth.push(completion.response_text);
        }
      });
    }
  });
  
  mem0Memories.forEach(memory => {
    if (memory.toLowerCase().includes('learn') || 
        memory.toLowerCase().includes('grow') ||
        memory.toLowerCase().includes('change') ||
        memory.toLowerCase().includes('improve')) {
      growth.push(memory);
    }
  });
  
  return growth.slice(0, 4);
}

// Generate personalized story using AI
async function generatePersonalizedStory(userData: UserData, azureApiKey: string, azureEndpoint: string): Promise<Milestone[]> {
  console.log('Generating personalized story with AI');
  
  const prompt = `You are an expert money coach creating a personalized Money Origin Story. Generate 13 milestones that tell this specific user's journey from their past money experiences to their healing and growth.

USER'S DATA:
Early Memories: ${userData.earlyMemories.join(' | ')}
Parental Influences: ${userData.parentalInfluences.join(' | ')}
Behavioral Patterns: ${userData.patterns.join(' | ')}
Emotional Triggers: ${userData.triggers.join(' | ')}
Financial Aspirations: ${userData.aspirations.join(' | ')}
Growth Areas: ${userData.growthAreas.join(' | ')}

Create 13 milestones following this exact structure:
1. "My Money Origin Story" - Their specific childhood/family money foundation
2. "Which shaped my Money Identity" - Core beliefs they formed about money
3. "Which created my Initial Feelings" - Emotional responses that developed
4. "Which triggered my Old Cycle" - Specific behaviors/patterns they developed
5. "Which increased my Core Stress" - What makes them most anxious about money
6. "Which trusted guidance helped me recognize" - What insights they've gained
7. "Which sparked my Necessary Shift" - Key realizations about change needed
8. "Which calms my Anxious Mind" - What brings them peace around money
9. "Which frees me from Old Traps" - How they're breaking old patterns
10. "Which nurtures my True Connections" - How money healing affects relationships
11. "Which grounds me in Gratitude" - What they appreciate about their journey
12. "Which grows my Healthy Money Practices" - Specific positive habits they're building
13. "Which builds my Security Foundation" - Their vision for financial stability

REQUIREMENTS:
- Make each milestone personal and specific to THEIR data
- Use first person ("I", "my")
- Keep content concise (1-2 sentences max per milestone)
- Focus on healing and growth trajectory
- If limited data, create realistic milestones based on common money healing patterns
- Ensure story flows logically from past struggles to present healing

Return ONLY a JSON array of 13 objects with this exact format:
[
  {"id": 1, "title": "My Money Origin Story", "content": "specific content"},
  {"id": 2, "title": "Which shaped my Money Identity", "content": "specific content"},
  ...
]`;

  try {
    const response = await fetch(`${azureEndpoint}/openai/deployments/gpt-4.1/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'You are a money coach expert at creating personalized healing stories. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response received, parsing JSON');
    
    // Parse the JSON response
    const milestones = JSON.parse(content);
    
    // Validate the structure
    if (!Array.isArray(milestones) || milestones.length !== 13) {
      throw new Error('Invalid milestone structure returned');
    }
    
    return milestones;
    
  } catch (error) {
    console.error('Error generating personalized story:', error);
    
    // Fallback to template-based generation if AI fails
    return generateFallbackStory(userData);
  }
}

// Fallback story generation if AI fails
function generateFallbackStory(userData: UserData): Milestone[] {
  console.log('Using fallback story generation');
  
  const fallbackMilestones: Milestone[] = [
    {
      id: 1,
      title: "My Money Origin Story",
      content: userData.earlyMemories.length > 0 ? 
        `My early relationship with money was shaped by ${userData.earlyMemories[0].substring(0, 80)}...` :
        "My money story began with learning that financial security and love were somehow connected"
    },
    {
      id: 2,
      title: "Which shaped my Money Identity",
      content: userData.parentalInfluences.length > 0 ?
        `I learned that money means ${userData.parentalInfluences[0].substring(0, 80)}...` :
        "I formed beliefs that money equals safety, but also brings worry and responsibility"
    },
    {
      id: 3,
      title: "Which created my Initial Feelings",
      content: userData.triggers.length > 0 ?
        `This created feelings of ${userData.triggers[0].substring(0, 80)}...` :
        "Money conversations brought up anxiety mixed with hope for a better future"
    },
    // ... continue with remaining milestones using available data or compassionate defaults
  ];
  
  // Fill remaining milestones with healing-focused content
  for (let i = 4; i <= 13; i++) {
    if (!fallbackMilestones[i - 1]) {
      fallbackMilestones.push({
        id: i,
        title: getDefaultTitle(i),
        content: getDefaultContent(i, userData)
      });
    }
  }
  
  return fallbackMilestones;
}

function getDefaultTitle(id: number): string {
  const titles = [
    "", "", "", // 1-3 handled above
    "Which triggered my Old Cycle",
    "Which increased my Core Stress", 
    "Which trusted guidance helped me recognize",
    "Which sparked my Necessary Shift",
    "Which calms my Anxious Mind",
    "Which frees me from Old Traps",
    "Which nurtures my True Connections",
    "Which grounds me in Gratitude",
    "Which grows my Healthy Money Practices",
    "Which builds my Security Foundation"
  ];
  return titles[id - 1] || "My Journey Continues";
}

function getDefaultContent(id: number, userData: UserData): string {
  // Generate appropriate content based on milestone type and available user data
  const contents = [
    "", "", "", // 1-3 handled in fallbackMilestones
    "I found myself repeating cycles of stress and relief around money decisions",
    "The uncertainty of financial stability created constant background anxiety",
    "Through reflection, I began to see the patterns that were keeping me stuck",
    "I realized that my worth as a person is not determined by my bank account",
    "Breathing and planning help me approach money decisions with more clarity",
    "I'm learning to make choices based on values rather than fear or impulse",
    "My relationships grow stronger when I'm honest about money challenges",
    "I appreciate the lessons my money journey has taught me about resilience",
    "Small, consistent steps are building healthier financial habits each day",
    "I'm creating a foundation of security that feels authentic and sustainable"
  ];
  return contents[id - 1] || "I continue to grow and heal my relationship with money";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate money origin story function started');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating story for user:', user.id);

    // Get API keys
    const mem0ApiKey = Deno.env.get('MEM0_API_KEY') || '';
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    if (!azureApiKey || !azureEndpoint) {
      throw new Error('Azure OpenAI configuration missing');
    }

    // Check if user already has a current story (less than 1 week old)
    const { data: existingStory } = await supabaseClient
      .from('user_money_stories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingStory) {
      console.log('Returning existing story');
      return new Response(
        JSON.stringify({ 
          story: existingStory,
          generated: false,
          message: 'Using existing story'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new story
    console.log('Generating new story');
    
    // 1. Aggregate user data
    const userData = await aggregateUserData(user.id, supabaseClient, mem0ApiKey);
    
    // 2. Generate personalized milestones
    const milestones = await generatePersonalizedStory(userData, azureApiKey, azureEndpoint);
    
    // 3. Save to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 1 week
    
    const storyData = {
      milestones,
      generatedAt: new Date().toISOString(),
      dataSourcesUsed: userData.rawData
    };

    const { data: newStory, error: insertError } = await supabaseClient
      .from('user_money_stories')
      .insert([{
        user_id: user.id,
        story_data: storyData,
        expires_at: expiresAt.toISOString(),
        data_sources: ['mem0', 'intake', 'chat', 'interventions'].filter(source => 
          userData.rawData[source as keyof typeof userData.rawData]?.length > 0
        ),
        insights_count: Object.values(userData).reduce((total, arr) => 
          total + (Array.isArray(arr) ? arr.length : 0), 0
        ) - 1 // Subtract 1 for rawData object
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error saving story:', insertError);
      throw insertError;
    }

    console.log('Story generated and saved successfully');
    
    return new Response(
      JSON.stringify({ 
        story: newStory,
        generated: true,
        message: 'New personalized story generated',
        dataSources: newStory.data_sources,
        insightsCount: newStory.insights_count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-money-origin-story:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate personalized money origin story'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 