
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/terms');
  };
  return <section className="relative overflow-hidden min-h-screen p-8" style={{
    backgroundColor: '#000000'
  }}>
      {/* Black Border Frame */}
      <div className="relative w-full h-[calc(100vh-4rem)] rounded-lg overflow-hidden" style={{
      backgroundColor: '#030003'
    }}>
        
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: "url('/lovable-uploads/8c16d090-97af-4932-9dd1-6cdbe40e1842.png')"
      }} />
        
        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12">
          {/* Main Text Content - Top Left */}
          <div className="flex-1 flex flex-col justify-start items-start text-left">
            <h1 className="font-dm-sans text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-6 opacity-0 animate-[fade-in_1.5s_ease-out_0.5s_forwards] text-shadow-lg text-left text-slate-50 font-medium" style={{ letterSpacing: '-0.01em' }}>
              Heal your money relationship
              <br />
              with{' '}
              <span className="font-semibold font-dm-sans" style={{ color: '#2F2F2F', backgroundColor: 'rgba(255, 255, 255, 0.39)', padding: '1px 3px', borderRadius: '0px', lineHeight: '0.8', display: 'inline-block', letterSpacing: '-0.01em' }}>
                Incluya ai
              </span>
              .
            </h1>
            
            
          </div>

          {/* CTA Button - Bottom Right */}
          <div className="flex justify-end opacity-0 animate-[fade-in_1.5s_ease-out_2s_forwards]">
            <Button onClick={handleClick} className="bg-black hover:bg-gray-900 text-white font-dm-sans font-normal pl-6 pr-4 py-4 text-base rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              Begin Your Journey
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>;
};

export default Hero;
