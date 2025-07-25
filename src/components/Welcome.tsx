import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIntakeStatus } from '@/hooks/useIntakeStatus';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight } from 'lucide-react';
const Welcome = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const {
    hasCompletedIntake,
    loading: intakeLoading
  } = useIntakeStatus();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    if (!loading && !intakeLoading && user) {
      if (hasCompletedIntake) {
        console.log('User has completed intake, redirecting to chat');
        navigate('/chat');
      }
    }
  }, [user, loading, intakeLoading, hasCompletedIntake, navigate]);
  const handleBeginJourney = () => {
    console.log('Beginning journey - navigating to intake questions');
    navigate('/intake');
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  if (loading || intakeLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>;
  }
  if (!user) {
    return null; // Will redirect to login
  }

  // If user has completed intake, they will be redirected to chat
  if (hasCompletedIntake) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to your coach...</div>
      </div>;
  }
  return <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
        <video autoPlay loop muted playsInline preload="auto" className="absolute w-full h-full object-cover">
          <source src="https://raw.githubusercontent.com/saltnpepper12/videos/main/Waves-fire-dust.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Sign Out Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <Button variant="ghost" onClick={e => {
        e.stopPropagation();
        handleSignOut();
      }} className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm font-display text-sm p-3">
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 sm:px-8 md:px-10 text-center flex flex-col items-center flex-1 justify-center">
        <h1 className="font-dm-sans text-xl sm:text-2xl lg:text-4xl text-white tracking-wide leading-relaxed opacity-0 animate-[fade-in_2s_ease-out_0.5s_forwards] drop-shadow-2xl mb-12 font-medium md:text-3xl">Let's explore your money mindset with seven quick questions so we can create your perfect space.</h1>
        
        {/* Next Button */}
        <div className="opacity-0 animate-[fade-in_1.5s_ease-out_2s_forwards]">
          <Button onClick={handleBeginJourney} className="flex items-center gap-3 bg-white text-incluya-text-dark hover:bg-white/90 px-8 py-4 text-lg font-dm-sans font-medium transition-all duration-300 rounded-full shadow-lg">
            Let's Begin
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>

      {/* Bottom Instruction Text */}
      <div className="relative z-10 pb-6">
        <p className="font-dm-sans text-base text-white/80 text-center opacity-0 animate-[fade-in_1.5s_ease-out_3s_forwards]">
          Feel free to skip any question by simply clicking the "Next" button
        </p>
      </div>
    </div>;
};
export default Welcome;