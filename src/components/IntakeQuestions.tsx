import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIntakeStatus } from '@/hooks/useIntakeStatus';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SplashScreen from './SplashScreen';

const IntakeQuestions = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const { user, loading } = useAuth();
  const { hasCompletedIntake, loading: intakeLoading } = useIntakeStatus();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Redirect to home if intake already completed
  useEffect(() => {
    if (!loading && !intakeLoading && user && hasCompletedIntake === true) {
      console.log('User has already completed intake, redirecting to home');
      navigate('/home');
    }
  }, [user, loading, intakeLoading, hasCompletedIntake, navigate]);

  const questions = [
    {
      id: 'bill_payment_timing',
      type: 'likert',
      question: "When bills are due, how often do you pay them at the last minute or late?",
      subtext: "1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Often, 5 = Always",
      gradient: "from-incluya-peach/20 to-incluya-coral/20"
    },
    {
      id: 'financial_worry_sharing',
      type: 'likert',
      question: "How often do you hold back from sharing financial worries with others?",
      subtext: "1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Often, 5 = Always",
      gradient: "from-incluya-turquoise/20 to-incluya-yellow/20"
    },
    {
      id: 'self_spending_guilt',
      type: 'likert',
      question: "How often do you feel bad spending money on yourself, even for things you need?",
      subtext: "1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Often, 5 = Always",
      gradient: "from-incluya-yellow/20 to-incluya-peach/20"
    },
    {
      id: 'money_goals',
      type: 'textarea',
      question: "What are some of your dreams or goals when it comes to money?",
      placeholder: "Share your financial aspirations and dreams...",
      gradient: "from-incluya-coral/20 to-incluya-turquoise/20"
    },
    {
      id: 'parental_money_talk',
      type: 'textarea',
      question: "As you grew up, how did your parents talk about money?",
      placeholder: "Tell us about the money conversations in your family...",
      gradient: "from-incluya-turquoise/20 to-incluya-coral/20"
    },
    {
      id: 'success_measurement',
      type: 'likert',
      question: "How often do you find yourself measuring success by what people earn or own?",
      subtext: "1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Often, 5 = Always",
      gradient: "from-incluya-yellow/20 to-incluya-turquoise/20"
    },
    {
      id: 'childhood_money_story',
      type: 'textarea',
      question: "If you shared one childhood story about money with us, what would it be?",
      placeholder: "Share a meaningful memory about money from your childhood...",
      gradient: "from-incluya-peach/20 to-incluya-yellow/20"
    }
  ];

  const handleAnswerChange = (questionId: string, value: string, subQuestionIndex?: number) => {
    // V2 uses simple question IDs, V1 used sub-question indexing
    const key = subQuestionIndex !== undefined ? `${questionId}_${subQuestionIndex}` : questionId;
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit responses.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting intake answers for user:', user.id);

    // Show splash screen immediately
    setShowSplashScreen(true);

    try {
      // Call the process-intake edge function with version 2 (new questions)
      const { data, error } = await supabase.functions.invoke('process-intake', {
        body: { answers, version: 2 }
      });

      if (error) {
        console.error('Error processing intake:', error);
        throw error;
      }

      console.log('Intake processing response:', data);

      if (data.success) {
        // Ensure we create/update the intake_sessions record manually
        console.log('Creating intake session record...');
        const { error: sessionError } = await supabase
          .from('intake_sessions')
          .upsert({
            user_id: user.id,
            completed_at: new Date().toISOString(),
            answers: answers
          }, {
            onConflict: 'user_id'
          });

        if (sessionError) {
          console.error('Error creating intake session:', sessionError);
          // Don't throw here - the intake was processed successfully
        } else {
          console.log('Intake session record created successfully');
        }
        
        // Show success toast after 1 second
        setTimeout(() => {
          toast({
            title: "Journey Complete! 🎉",
            description: "Your responses have been saved and your personal AI coach is ready.",
          });
        }, 1000);

        setIsSubmitting(false);

      } else {
        throw new Error('Processing failed');
      }

    } catch (error) {
      console.error('Error submitting intake:', error);
      toast({
        title: "Error",
        description: "There was an issue saving your responses. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      setShowSplashScreen(false);
    }
  };

  const handleSplashComplete = () => {
    console.log('Splash screen completed, navigating to home');
    navigate('/home');
  };

  if (loading || intakeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Show loading while checking intake status
  if (hasCompletedIntake === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Checking your progress...</div>
      </div>
    );
  }

  // Will redirect to chat if intake already completed
  if (hasCompletedIntake === true) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to your coach...</div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <>
      {showSplashScreen ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
          {/* Video Background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
            <video 
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute w-full h-full object-cover"
            >
              <source 
                src="https://raw.githubusercontent.com/saltnpepper12/videos/main/leaf.mp4" 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black/50"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-4xl px-6 py-16">
            {/* Progress Bar with Enhanced Design */}
            <div className="mb-12">
              <div className="relative">
                <div className="w-full bg-black/30 backdrop-blur-sm rounded-full h-2 border border-white/20 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-incluya-yellow to-incluya-turquoise h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-white/80 text-base font-sans font-semibold drop-shadow-sm">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                  <div className="flex space-x-1.5">
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          index <= currentQuestion 
                            ? 'bg-incluya-yellow shadow-lg' 
                            : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'}`}>
              <div className="space-y-12">
                {/* Question Header */}
                <div className="text-center space-y-6">
                  {/* Question Title */}
                  <h2 className="font-sans text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed drop-shadow-xl">
                    {currentQ.question}
                  </h2>
                  
                  {currentQ.subtext && (
                    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/30 inline-block">
                      <p className="text-white/95 text-base font-sans font-semibold drop-shadow-md">
                        {currentQ.subtext}
                      </p>
                    </div>
                  )}
                </div>

                {/* Answer Section */}
                <div className="space-y-6">
                  {currentQ.type === 'textarea' ? (
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                        <Textarea
                          placeholder={currentQ.placeholder}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          className="min-h-[140px] bg-transparent border-none text-white placeholder:text-white/60 text-base font-sans resize-none focus:ring-2 focus:ring-incluya-yellow/50 focus:outline-none font-medium drop-shadow-sm"
                        />
                      </div>
                    </div>
                  ) : currentQ.type === 'likert' ? (
                    <div className="max-w-xl mx-auto">
                      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-lg">
                        <RadioGroup
                          value={answers[currentQ.id] || ''}
                          onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                          className="flex space-x-8 justify-center"
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num} className="flex flex-col items-center space-y-3 group">
                              <RadioGroupItem 
                                value={num.toString()} 
                                id={`${currentQ.id}_${num}`}
                                className="border-white/50 text-white data-[state=checked]:bg-incluya-yellow data-[state=checked]:border-incluya-yellow transition-all duration-200 hover:border-incluya-yellow/70 hover:scale-110 w-8 h-8"
                              />
                              <Label 
                                htmlFor={`${currentQ.id}_${num}`}
                                className="text-white/90 font-sans cursor-pointer hover:text-incluya-yellow transition-colors text-lg group-hover:scale-110 transition-transform duration-200 drop-shadow-sm font-bold"
                              >
                                {num}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Navigation - Fixed responsive layout */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-black/30 font-sans disabled:opacity-30 transition-all duration-200 px-6 py-3 text-base border border-white/30 hover:border-white/50 w-full sm:w-auto order-2 sm:order-1 font-semibold backdrop-blur-sm rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </Button>

                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-8 sm:px-10 py-3 text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-white/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2 rounded-full"
                    >
                      {isSubmitting ? 'Processing...' : 'Complete Journey'}
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-8 sm:px-10 py-3 text-base transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-white/20 w-full sm:w-auto order-1 sm:order-2 rounded-full"
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IntakeQuestions;
