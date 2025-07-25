
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useIntakeStatus = () => {
  const [hasCompletedIntake, setHasCompletedIntake] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkIntakeStatus = async () => {
      if (!user) {
        console.log('No user found, setting loading to false');
        setHasCompletedIntake(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Checking intake status for user:', user.id);
        
        // Check if user has any completed intake sessions
        const { data, error } = await supabase
          .from('intake_sessions')
          .select('id, completed_at, created_at')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking intake status:', error);
          setHasCompletedIntake(false);
        } else {
          console.log('Intake sessions data:', data);
          
          // Check if any session has a completed_at timestamp or if there are any records at all
          const hasCompleted = data && data.length > 0 && data.some(session => session.completed_at);
          console.log('User has completed intake:', hasCompleted);
          console.log('Sessions found:', data?.length || 0);
          
          setHasCompletedIntake(hasCompleted);
        }
      } catch (error) {
        console.error('Error in intake status check:', error);
        setHasCompletedIntake(false);
      } finally {
        setLoading(false);
      }
    };

    checkIntakeStatus();
  }, [user]);

  return { hasCompletedIntake, loading };
};
