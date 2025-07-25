import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { intervention_id } = await req.json();

    if (!intervention_id) {
      return new Response(
        JSON.stringify({ error: 'Intervention ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing intervention completion for user:', user.id, 'intervention:', intervention_id);

    // Find the active intervention progress record
    const { data: progressRecord, error: findError } = await supabaseClient
      .from('user_intervention_progress')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('intervention_id', intervention_id)
      .eq('status', 'active')
      .maybeSingle();

    if (findError) {
      console.error('Error finding active intervention progress:', findError);
      return new Response(
        JSON.stringify({ error: 'Database error while finding intervention progress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!progressRecord) {
      console.log('No active intervention progress found, checking if already completed...');
      
      // Check if intervention was already completed
      const { data: completedRecord, error: completedError } = await supabaseClient
        .from('user_intervention_progress')
        .select('id, status, completed_at')
        .eq('user_id', user.id)
        .eq('intervention_id', intervention_id)
        .eq('status', 'completed')
        .maybeSingle();
      
      if (completedRecord) {
        console.log('Intervention was already completed at:', completedRecord.completed_at);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Intervention was already completed',
            already_completed: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'No active intervention found to complete' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found active intervention progress record:', progressRecord.id);

    // Mark the intervention progress as completed
    const { error: updateError } = await supabaseClient
      .from('user_intervention_progress')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_type: 'completed'
      })
      .eq('id', progressRecord.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating intervention progress:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to mark intervention as completed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also update the intervention history record if it exists
    const { error: historyUpdateError } = await supabaseClient
      .from('user_intervention_history')
      .update({ 
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('intervention_id', intervention_id)
      .is('completed_at', null);

    if (historyUpdateError) {
      console.error('Error updating intervention history:', historyUpdateError);
      // Don't fail the request for history update errors
    }

    console.log('Intervention marked as completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Intervention completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in intervention-completion function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});