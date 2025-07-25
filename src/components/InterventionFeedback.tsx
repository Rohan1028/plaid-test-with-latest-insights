
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InterventionFeedbackProps {
  interventionId: string;
  progressId: string;
  interventionName: string;
  onFeedbackComplete: () => void;
}

const InterventionFeedback: React.FC<InterventionFeedbackProps> = ({
  interventionId,
  progressId,
  interventionName,
  onFeedbackComplete,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('intervention_feedback')
        .insert([{
          user_id: user.id,
          intervention_id: interventionId,
          progress_id: progressId,
          rating: rating,
          feedback_text: feedbackText.trim() || null
        }]);

      if (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Failed to submit feedback');
        return;
      }

      toast.success('Thank you for your feedback!');
      onFeedbackComplete();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipFeedback = () => {
    onFeedbackComplete();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
          <ThumbsUp className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Intervention Complete!</CardTitle>
        <p className="text-sm text-gray-600">
          You've successfully completed "{interventionName}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate this intervention?
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                className={`p-1 transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any additional thoughts? (Optional)
          </label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your thoughts about this intervention..."
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipFeedback}
            disabled={isSubmitting}
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterventionFeedback;
