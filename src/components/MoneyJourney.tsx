
import React from 'react';
import { User, Heart, Flag } from 'lucide-react';

const MoneyJourney = () => {
  const journeySteps = [
    {
      text: "Learned the source of my financial anxiety",
      position: "bottom"
    },
    {
      text: "Increased my confidence and learned how to save",
      position: "middle"
    },
    {
      text: "Changed my career to earn more money",
      position: "top"
    }
  ];

  return (
    <section className="bg-incluya-turquoise/10 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-16">
          Visualize Your Money Journey
        </h2>
        
        <div className="relative mx-auto max-w-md glass-panel p-8 overflow-hidden min-h-[500px]">
          {/* Background elements */}
          <div className="absolute bottom-0 right-0 w-full h-1/3 bg-incluya-yellow-dark/30 z-0"></div>
          
          <h3 className="font-serif text-2xl font-semibold mb-10 relative z-10 text-center">Money Journey</h3>
          
          <div className="relative z-10">
            {/* Timeline stem */}
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-incluya-yellow-dark transform -translate-x-1/2"></div>
            
            {/* Journey points */}
            {journeySteps.map((step, index) => (
              <div 
                key={index} 
                className={`relative ${
                  step.position === "top" ? "mb-32" : 
                  step.position === "middle" ? "my-32" : 
                  "mt-32"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 timeline-dot"></div>
                
                {/* Leaves */}
                <div 
                  className="leaf w-14 h-10 absolute" 
                  style={{ 
                    right: index % 2 ? "auto" : "-10px", 
                    left: index % 2 ? "-10px" : "auto",
                    top: "5px" 
                  }}
                ></div>
                
                {/* Text box */}
                <div 
                  className={`bg-white/80 p-3 rounded-lg max-w-[160px] absolute top-0 ${
                    index % 2 ? "left-auto right-12" : "right-auto left-12"
                  }`}
                >
                  <p className="text-sm">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bottom action icons */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-around pt-4 z-10">
            <button className="p-2 hover:bg-incluya-turquoise/20 rounded-full transition-colors">
              <User size={20} />
            </button>
            <button className="p-2 hover:bg-incluya-turquoise/20 rounded-full transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-2 hover:bg-incluya-turquoise/20 rounded-full transition-colors">
              <Flag size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoneyJourney;
