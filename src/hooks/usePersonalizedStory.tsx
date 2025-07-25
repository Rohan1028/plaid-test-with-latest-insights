import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Milestone {
  id: number;
  title: string;
  content: string;
}

interface StoryData {
  milestones: Milestone[];
  generatedAt: string;
  dataSourcesUsed: any;
}

interface UserMoneyStory {
  id: string;
  user_id: string;
  story_data: StoryData;
  generated_at: string;
  expires_at: string;
  data_sources: string[];
  insights_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Default fallback milestones - moved outside component to prevent re-renders
const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 1,
    title: "My Money Origin Story",
    content: "Family wealth bought affection and popularity then sudden bankruptcy cost us friendships"
  },
  {
    id: 2,
    title: "Which shaped my Money Identity",
    content: "Only spend after bills are paid but twisted money into a substitute for love"
  },
  {
    id: 3,
    title: "Which created my Initial Feelings",
    content: "Relief after paying bills followed by strong urges for reward treats"
  },
  {
    id: 4,
    title: "Which triggered my Old Cycle",
    content: "Pay essential expenses then overspend on self-reward then regret"
  },
  {
    id: 5,
    title: "Which increased my Core Stress",
    content: "Constant dread that financial stability could disappear overnight"
  },
  {
    id: 6,
    title: "Which trusted guidance helped me recognize",
    content: "My isolation could only heal through honest money conversations"
  },
  {
    id: 7,
    title: "Which sparked my Necessary Shift",
    content: "Self-worth is who I am not what I spend"
  },
  {
    id: 8,
    title: "Which calms my Anxious Mind",
    content: "Building plans to handle financial what ifs before they happen"
  },
  {
    id: 9,
    title: "Which frees me from Old Traps",
    content: "Choosing genuine self-expression over costly appearances"
  },
  {
    id: 10,
    title: "Which nurtures my True Connections",
    content: "Cultivating friendships based on shared moments not spending performances"
  },
  {
    id: 11,
    title: "Which grounds me in Gratitude",
    content: "Daily noticing of non-monetary abundance like health and nature"
  },
  {
    id: 12,
    title: "Which grows my Healthy Money Practices",
    content: "Modest everyday spending combined with pre-planned affordable treats"
  },
  {
    id: 13,
    title: "Which builds my Security Foundation",
    content: "Automatic weekly savings for my three-month stress-free travel cushion"
  }
];

export const usePersonalizedStory = () => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [story, setStory] = useState<UserMoneyStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);

  // Check if story is expired
  const checkIfExpired = useCallback((expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  }, []);

  // Load existing story from database
  const loadExistingStory = useCallback(async () => {
    if (!user?.id) return null;

    try {
      console.log('Loading existing money story for user:', user.id);

      const { data, error } = await supabase
        .from('user_money_stories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Database query result:', { data, error });

      if (error) {
        console.error('Error loading existing story:', error);
        return null;
      }

      if (data) {
        console.log('Found existing story:', data.id);
        console.log('Story data structure:', data);
        
        const isStoryExpired = checkIfExpired(data.expires_at);
        setIsExpired(isStoryExpired);
        
        if (!isStoryExpired) {
          // Story is still valid - properly type the data
          const typedStory: UserMoneyStory = {
            ...data,
            story_data: data.story_data as unknown as StoryData
          };
          setStory(typedStory);
          
          // Handle different possible data structures
          let milestones = [];
          const storyData = data.story_data as any;
          if (storyData?.milestones) {
            milestones = storyData.milestones;
          } else if (Array.isArray(storyData)) {
            milestones = storyData;
          } else {
            console.error('Unexpected story data structure:', storyData);
            return null;
          }
          
          console.log('Setting milestones:', milestones);
          setMilestones(milestones);
          setDataSources(data.data_sources || []);
          return typedStory;
        } else {
          console.log('Story is expired, will need to regenerate');
          setIsExpired(true);
          return null;
        }
      } else {
        console.log('No existing story found in database');
      }

      return null;
    } catch (error) {
      console.error('Exception loading existing story:', error);
      return null;
    }
  }, [user?.id, checkIfExpired]);

  // Generate new personalized story
  const generateStory = useCallback(async (force = false) => {
    if (!user?.id) {
      console.log('No user ID available for story generation');
      return false;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('Generating personalized money story...');

      const { data, error } = await supabase.functions.invoke('generate-money-origin-story', {
        body: { force }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error generating story:', error);
        setError('Failed to generate personalized story. Using default content.');
        // Fall back to default milestones
        setMilestones(DEFAULT_MILESTONES);
        setIsExpired(false);
        return false;
      }

      if (data?.story) {
        console.log('Story generated successfully');
        console.log('Story structure:', data.story);
        
        // Properly type the story data
        const typedStory: UserMoneyStory = {
          ...data.story,
          story_data: data.story.story_data as unknown as StoryData
        };
        setStory(typedStory);
        
        // Handle different possible data structures
        let milestones = [];
        const storyData = data.story.story_data as any;
        if (storyData?.milestones) {
          milestones = storyData.milestones;
        } else if (Array.isArray(storyData)) {
          milestones = storyData;
        } else {
          console.error('Unexpected story data structure:', storyData);
          // Fall back to default milestones
          setMilestones(DEFAULT_MILESTONES);
          setIsExpired(false);
          return false;
        }
        
        console.log('Setting generated milestones:', milestones);
        setMilestones(milestones);
        setDataSources(data.story.data_sources || []);
        setIsExpired(false);
        setError(null);
        return true;
      } else {
        console.error('No story data in response:', data);
        throw new Error('No story data returned from generation');
      }

    } catch (error) {
      console.error('Exception generating story:', error);
      setError('Failed to generate personalized story. Using default content.');
      // Fall back to default milestones
      setMilestones(DEFAULT_MILESTONES);
      setIsExpired(false);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id]);

  // Initialize story on component mount
  const initializeStory = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID, using default milestones');
      setMilestones(DEFAULT_MILESTONES);
      setIsLoading(false);
      return;
    }

    console.log('Initializing story for user:', user.id);
    setIsLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Story loading timeout - using default milestones');
      setMilestones(DEFAULT_MILESTONES);
      setIsExpired(false);
      setError('Story loading took too long. Using default content.');
      setIsLoading(false);
    }, 30000); // 30 second timeout
    
    try {
      // First, try to load existing valid story
      const existingStory = await loadExistingStory();
      
      if (!existingStory) {
        // No valid story exists, generate a new one
        console.log('No valid existing story found, generating new one');
        const generated = await generateStory();
        
        if (!generated) {
          // Generation failed, use default milestones
          console.log('Story generation failed, using default milestones');
          setMilestones(DEFAULT_MILESTONES);
          setIsExpired(false);
        }
      }
    } catch (error) {
      console.error('Error initializing story:', error);
      setError('Failed to load your personalized story. Using default content.');
      setMilestones(DEFAULT_MILESTONES);
      setIsExpired(false);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [user?.id, loadExistingStory, generateStory]);

  // Manual regeneration function
  const regenerate = useCallback(async () => {
    if (isGenerating) return;
    
    console.log('Manual story regeneration requested');
    await generateStory(true);
  }, [generateStory, isGenerating]);

  // Check if story should be refreshed based on user activity
  const shouldRefresh = useCallback((): boolean => {
    if (!story) return false;
    
    const daysSinceGeneration = (Date.now() - new Date(story.generated_at).getTime()) / (1000 * 60 * 60 * 24);
    
    // Suggest refresh if:
    // - Story is more than 5 days old, or
    // - Story is expired
    return daysSinceGeneration >= 5 || isExpired;
  }, [story, isExpired]);

  // Initialize on user change
  useEffect(() => {
    console.log('User effect triggered:', { user: user?.id, hasUser: !!user });
    
    if (user?.id) {
      console.log('User found, initializing story');
      initializeStory();
    } else if (user === null) {
      // User is explicitly null (not logged in)
      console.log('No user logged in, using default milestones');
      setMilestones(DEFAULT_MILESTONES);
      setStory(null);
      setIsLoading(false);
      setIsExpired(false);
      setError(null);
      setDataSources([]);
    } else {
      // User is undefined (still loading auth state)
      console.log('Auth state still loading...');
      setIsLoading(true);
    }
  }, [user, initializeStory]);

  return {
    milestones,
    isLoading,
    isGenerating,
    isExpired,
    error,
    story,
    dataSources,
    shouldRefresh: shouldRefresh(),
    regenerate,
    generateStory: () => generateStory(true)
  };
};
