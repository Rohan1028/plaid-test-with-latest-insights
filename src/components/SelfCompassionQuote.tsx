
import React from 'react';
import { User, Heart, Flag } from 'lucide-react';

const SelfCompassionQuote = () => {
  return (
    <section className="bg-incluya-peach/20 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-lg p-8">
          {/* Top left squiggle */}
          <div className="absolute -top-4 -left-4 w-20 h-20">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M10,30 Q30,5 50,30 T90,30" 
                fill="none" 
                stroke="#A8E6CF" 
                strokeWidth="6" 
              />
            </svg>
          </div>
          
          {/* Bottom right blob */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-incluya-turquoise/30 rounded-full"></div>
          
          <h3 className="font-serif text-2xl font-semibold mb-6 relative z-10 text-incluya-text-dark">Self-Compassion</h3>
          
          <div className="relative z-10">
            <p className="text-gray-700 mb-4">
              "Self-compassion is like a muscle. The more we practice flexing it, especially when life doesn't go exactly according to plan (a frequent scenario for most of us), the stronger and more resilient our compassion muscle becomes."
            </p>
            <p className="font-medium text-incluya-text-dark">- Sharon Salzberg</p>
          </div>
          
          {/* Bottom action icons */}
          <div className="flex justify-between mt-12 relative z-10">
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

export default SelfCompassionQuote;
