import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create 4-5 question plan from intervention prompt with context
async function createInterventionPlan(
  interventionPrompt: string, 
  triggerReason: string,
  conversationContext: string,
  azureApiKey: string, 
  azureEndpoint: string
): Promise<string[]> {
  
  console.log('Creating intervention plan for:', interventionPrompt.substring(0, 100) + '...');
  
  const planningPrompt = `You are an expert therapeutic intervention designer. I will give you a detailed intervention prompt that describes a specific therapeutic money coaching process. Your job is to create exactly 4-5 questions that are PERFECTLY aligned with this specific intervention's goals and methods.

INTERVENTION PROMPT (this describes the specific therapeutic approach):
${interventionPrompt}

TRIGGER CONTEXT: ${triggerReason}
CONVERSATION CONTEXT: ${conversationContext}

CRITICAL REQUIREMENTS:
1. Extract the SPECIFIC FOCUS from the intervention prompt (e.g., if it's about envy, ask about envy; if it's about childhood money memories, ask about that; if it's about procrastination beliefs, focus on that)
2. Follow the intervention's SPECIFIC APPROACH and TONE described in the prompt
3. Use the intervention's SPECIFIC TERMINOLOGY and concepts
4. Create questions that match the intervention's FLOW or structure if one is provided
5. Make questions PROGRESSIVE - building from surface awareness to deeper insight
6. Incorporate the user's trigger context and conversation naturally

EXAMPLE - If the intervention is "Envy Exploration Process" about "examining feelings of inadequacy triggered by others' apparent success," then ask specifically about:
- Recent experiences of financial envy
- What specifically triggers the envy
- Underlying needs the envy reveals
- How to reframe envy as information

DO NOT create generic money questions. Create questions that ONLY make sense for THIS SPECIFIC intervention.

Respond with ONLY a JSON array of 4-5 questions:
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]`;

  try {
    const response = await fetch(`${azureEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert therapeutic intervention designer. You must create questions that are 100% specific to the intervention described. Always respond with valid JSON array only.' 
          },
          { role: 'user', content: planningPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI planning failed: ${response.status} - ${errorText}`);
      throw new Error(`AI planning failed: ${response.status}`);
    }

    const data = await response.json();
    let planText = data.choices[0].message.content.trim();
    
    // Clean up the response - sometimes AI adds extra text
    if (planText.includes('[') && planText.includes(']')) {
      const startIndex = planText.indexOf('[');
      const endIndex = planText.lastIndexOf(']') + 1;
      planText = planText.substring(startIndex, endIndex);
    }
    
    console.log('AI response for question planning:', planText);
    
    let questions;
    try {
      questions = JSON.parse(planText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid JSON response from AI');
    }
    
    if (!Array.isArray(questions) || questions.length < 4 || questions.length > 5) {
      console.error('Invalid question plan format:', questions);
      throw new Error('Invalid question plan format');
    }
    
    console.log('Successfully created intervention-specific questions:', questions);
    return questions;
    
  } catch (error) {
    console.error('Error creating intervention plan:', error);
    
    // Create highly specific fallback questions based on intervention prompt analysis
    console.log('Creating intervention-specific fallback questions...');
    
    const promptLower = interventionPrompt.toLowerCase();
    let interventionSpecificFallback;
    
    // Envy Exploration Process
    if (promptLower.includes('envy') || promptLower.includes('inadequacy triggered by others')) {
      interventionSpecificFallback = [
        "I'm noticing you might be dealing with some financial envy right now. Can you think of a recent situation where you felt envious of someone else's financial situation?",
        "What specifically about their situation triggered that feeling of envy? Was it what they could afford, how secure they seemed, or something else?",
        "What do you think that envy might be telling you about your own needs or desires? What is it pointing toward?",
        "How do those feelings of financial envy typically affect you? What do you do with them?",
        "What would it look like to use that envy as information about what you value, rather than as self-criticism?"
      ];
    }
    // Purchase Motivation Evaluation
    else if (promptLower.includes('purchase motivation') || promptLower.includes('buying impulses')) {
      interventionSpecificFallback = [
        "Let's explore a recent purchase you made. Can you think of something you bought recently that you'd like to reflect on?",
        "What was happening just before you decided to buy it? What was your mood or situation like?",
        "What emotion were you feeling when you made that purchase? Stressed, excited, bored, seeking comfort?",
        "What need do you think you were trying to meet with that purchase? What were you hoping it would give you?",
        "Looking back, what would be helpful for your future self to remember about this pattern?"
      ];
    }
    // Childhood Money Connection
    else if (promptLower.includes('childhood') || promptLower.includes('early money memories')) {
      interventionSpecificFallback = [
        "What's a current financial emotion or situation that feels particularly intense for you right now?",
        "When you think back to childhood, what's one of your earliest or strongest memories related to money?",
        "What were you feeling in that childhood moment, and how is that similar to what you feel about money now?",
        "What messages about money were you getting from your family during that time?",
        "How might that childhood experience be showing up in your financial life today?"
      ];
    }
    // Self-Permission Framework
    else if (promptLower.includes('self-permission') || promptLower.includes('internalized financial restrictions')) {
      interventionSpecificFallback = [
        "What makes it hard for you to spend money on yourself, even for things you genuinely need?",
        "What values do you have about taking care of others? How might those same values apply to taking care of yourself?",
        "What criteria would help you know when spending on yourself is not just okay, but important?",
        "When guilt comes up about spending on yourself, what would you want to remember?",
        "What would your personal permission framework look like? What guidelines would feel right for you?"
      ];
    }
    // Financial Values Hierarchy
    else if (promptLower.includes('values hierarchy') || promptLower.includes('core financial values')) {
      interventionSpecificFallback = [
        "What do you care most deeply about in life? Not what you think you should care about, but what truly matters to you?",
        "Can you think of times when how you spent money didn't feel aligned with what you care about?",
        "When your values compete with each other in financial decisions, how do you typically choose?",
        "If you had to rank your top 5 values in order of importance, how would you order them?",
        "How could you use your values hierarchy to guide future financial decisions?"
      ];
    }
    // Cognitive Restructuring of Procrastination
    else if (promptLower.includes('procrastination') || promptLower.includes('avoidance behaviors')) {
      interventionSpecificFallback = [
        "What financial tasks do you find yourself putting off or avoiding completely?",
        "What goes through your mind when you think about doing those financial tasks?",
        "What do you tell yourself that makes it easier to avoid these tasks?",
        "How accurate and helpful are those thoughts in getting you what you want?",
        "What would be a more helpful way to think about these financial tasks?"
      ];
    }
    // Alternative Story Development
    else if (promptLower.includes('alternative story') || promptLower.includes('family financial identity')) {
      interventionSpecificFallback = [
        "What story have you carried about your family's relationship with money or financial capabilities?",
        "Can you remember a specific moment when you first absorbed or felt this story?",
        "How has this story about your family and money shaped your own financial identity?",
        "What evidence might contradict or challenge this inherited money story?",
        "What new story about your family's financial identity would feel more empowering and true?"
      ];
    }
    // Generic but contextual fallback
    else {
      interventionSpecificFallback = [
        "Based on what brought you to this reflection, what feels most important to explore about your money relationship right now?",
        "How is this current situation connecting to deeper patterns in your financial life?",
        "What emotions are coming up as you think about this area of your money journey?",
        "What would feel most helpful to understand or shift about this aspect of your financial experience?",
        "What insight or next step feels most important for you around this topic?"
      ];
    }
    
    console.log('Using intervention-specific fallback questions:', interventionSpecificFallback);
    return interventionSpecificFallback;
  }
}

// Helper function to generate contextual follow-up
async function generateFollowUp(
  userResponse: string,
  questionHistory: string[],
  currentQuestionIndex: number,
  interventionPrompt: string,
  azureApiKey: string,
  azureEndpoint: string
): Promise<{ message: string; isComplete: boolean }> {
  
  const isLastQuestion = currentQuestionIndex >= questionHistory.length - 1;
  
  const followUpPrompt = `You are a warm, empathetic money coach guiding someone through a reflection exercise.

Intervention Focus: "${interventionPrompt}"

Previous Questions Asked:
${questionHistory.slice(0, currentQuestionIndex + 1).map((q, i) => `${i + 1}. ${q}`).join('\n')}

User's Current Response: "${userResponse}"

Context: This is question ${currentQuestionIndex + 1} of ${questionHistory.length} in the reflection exercise.

${isLastQuestion ? 
  `This was the FINAL question. Create a warm, supportive closing message that:
- Acknowledges their complete journey through all questions
- Highlights key insights or growth they've shared
- Offers encouragement about their self-awareness
- Provides gentle closure to the exercise
- Is 2-3 sentences maximum
- Does NOT ask another question` 
  : 
  `Create a brief, empathetic response that:
- Validates their current response warmly
- Briefly reflects what you heard
- Naturally transitions to the next question
- Is 1-2 sentences maximum before the next question

Next Question: "${questionHistory[currentQuestionIndex + 1]}"`}

Keep your response conversational, warm, and concise.`;

  try {
    const response = await fetch(`${azureEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-04-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a warm, empathetic money coach providing brief, supportive responses.' },
          { role: 'user', content: followUpPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI follow-up failed: ${response.status}`);
    }

    const data = await response.json();
    let message = data.choices[0].message.content.trim();
    
    // Add the next question if not complete
    if (!isLastQuestion) {
      message += `\n\n${questionHistory[currentQuestionIndex + 1]}`;
    }
    
    return { 
      message,
      isComplete: isLastQuestion 
    };
    
  } catch (error) {
    console.error('Error generating follow-up:', error);
    
    if (isLastQuestion) {
      return {
        message: "Thank you for taking this journey of reflection with me. Your insights and self-awareness are truly valuable. I hope this exercise has given you some new perspectives to carry forward.",
        isComplete: true
      };
    } else {
      return {
        message: `Thank you for sharing that with me. ${questionHistory[currentQuestionIndex + 1]}`,
        isComplete: false
      };
    }
  }
}

serve(async (req) => {
  console.log('=== Intervention Guidance Function Started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const requestBody = await req.json();
    const { action, intervention_id, progress_id, user_response } = requestBody;

    console.log('Action:', action, 'User:', user.id);

    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    if (!azureApiKey || !azureEndpoint) {
      throw new Error('Azure OpenAI configuration missing');
    }

    // Handle intervention start
    if (action === 'start') {
      if (!intervention_id) {
        return new Response(
          JSON.stringify({ error: 'Intervention ID is required for start action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Starting intervention:', intervention_id);

      // Get intervention details
      const { data: intervention, error: interventionError } = await supabaseClient
        .from('interventions')
        .select('*')
        .eq('id', intervention_id)
        .single();

      if (interventionError || !intervention) {
        console.error('Error fetching intervention:', interventionError);
        return new Response(
          JSON.stringify({ error: 'Intervention not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the trigger context from intervention history
      const { data: historyRecord, error: historyError } = await supabaseClient
        .from('user_intervention_history')
        .select('trigger_reason, conversation_context')
        .eq('user_id', user.id)
        .eq('intervention_id', intervention_id)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const triggerReason = historyRecord?.trigger_reason || 'general_support';
      const conversationContext = historyRecord?.conversation_context || 'Initial conversation context not available';

      console.log('Using trigger context:', { triggerReason, conversationContextLength: conversationContext.length });

      // Create 4-5 question plan from intervention prompt with context
      const questionPlan = await createInterventionPlan(
        intervention.intervention_prompt,
        triggerReason,
        conversationContext,
        azureApiKey,
        azureEndpoint
      );
      console.log('Created personalized question plan:', questionPlan);

      // Create intervention progress record
      const { data: progressRecord, error: progressError } = await supabaseClient
        .from('user_intervention_progress')
        .insert([{
          user_id: user.id,
          intervention_id: intervention_id,
          status: 'active',
          started_at: new Date().toISOString(),
          notes: JSON.stringify({ question_plan: questionPlan, current_question_index: 0 })
        }])
        .select()
        .single();

      if (progressError || !progressRecord) {
        console.error('Error creating progress record:', progressError);
        return new Response(
          JSON.stringify({ error: 'Failed to start intervention' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate welcome message with first question
      const welcomeMessage = `Welcome to "${intervention.name}" - ${intervention.description}

Let's begin this reflection journey together. Take your time with each question and share whatever feels authentic to you.

${questionPlan[0]}`;

      return new Response(
        JSON.stringify({
          success: true,
          message: welcomeMessage,
          progress_id: progressRecord.id,
          intervention_name: intervention.name,
          current_question_index: 0,
          total_questions: questionPlan.length,
          is_complete: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle user response
    if (action === 'respond') {
      if (!progress_id || !user_response) {
        return new Response(
          JSON.stringify({ error: 'Progress ID and user response are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing response for progress:', progress_id);

      // Get progress record
      const { data: progressRecord, error: progressError } = await supabaseClient
        .from('user_intervention_progress')
        .select('*, interventions(*)')
        .eq('id', progress_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressError) {
        console.error('Error fetching progress record:', progressError);
        return new Response(
          JSON.stringify({ error: 'Database error while fetching progress record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!progressRecord) {
        console.error('Progress record not found for ID:', progress_id);
        return new Response(
          JSON.stringify({ error: 'Progress record not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse the question plan and current state
      const notes = JSON.parse(progressRecord.notes || '{}');
      const questionPlan = notes.question_plan || [];
      const currentQuestionIndex = notes.current_question_index || 0;

      // Save the user's response
      const { error: responseError } = await supabaseClient
        .from('milestone_completions')
        .insert([{
          user_id: user.id,
          intervention_progress_id: progress_id,
          milestone_id: null, // Set to null since we're using synthetic progress tracking
          response_text: user_response,
          completed_at: new Date().toISOString()
        }]);

      if (responseError) {
        console.error('Error saving response:', responseError);
        // Continue despite error - don't block progression
      }

      // Generate follow-up response
      const { message, isComplete } = await generateFollowUp(
        user_response,
        questionPlan,
        currentQuestionIndex,
        progressRecord.interventions.intervention_prompt,
        azureApiKey,
        azureEndpoint
      );

      // Update progress record
      const newQuestionIndex = currentQuestionIndex + 1;
      const updatedNotes = {
        ...notes,
        current_question_index: newQuestionIndex,
        responses: [...(notes.responses || []), user_response]
      };

      const updateData: any = {
        notes: JSON.stringify(updatedNotes),
        updated_at: new Date().toISOString()
      };

      if (isComplete) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.completion_type = 'completed';
      }

      const { error: updateError } = await supabaseClient
        .from('user_intervention_progress')
        .update(updateData)
        .eq('id', progress_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating progress:', updateError);
        // Continue despite error
      }

      console.log('Intervention response processed:', { isComplete, questionIndex: newQuestionIndex });

      return new Response(
        JSON.stringify({
          success: true,
          message: message,
          current_question_index: newQuestionIndex,
          total_questions: questionPlan.length,
          is_complete: isComplete
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in intervention-guidance function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
