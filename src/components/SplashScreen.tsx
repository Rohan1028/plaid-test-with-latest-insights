
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4000; // 4 seconds
    const interval = 30; // Update every 30ms for smooth animation
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 100); // Small delay after completion
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Static Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-[-1]"
        style={{
          backgroundImage: 'url("https://raw.githubusercontent.com/saltnpepper12/videos/main/spash-screen.png")'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-[120px]">
        <div className="space-y-12">
          {/* Text Container */}
          <div 
            className="border border-white/10 rounded-lg p-8"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="text-left space-y-2">
              <h1 className="font-dm-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white leading-relaxed opacity-0 animate-[fade-in_1.5s_ease-out_0.5s_forwards] drop-shadow-2xl">
                Incluya is reflecting
              </h1>
              <h2 className="font-dm-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white leading-relaxed opacity-0 animate-[fade-in_1.5s_ease-out_0.7s_forwards] drop-shadow-2xl">
                curating a plan for you.
              </h2>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="opacity-0 animate-[fade-in_1s_ease-out_1s_forwards]">
            <div className="w-full">
              <Progress 
                value={progress} 
                className="h-2 bg-white/20 rounded-full overflow-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
