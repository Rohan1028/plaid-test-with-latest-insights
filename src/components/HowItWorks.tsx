
import React from 'react';

const steps = [
  {
    number: "01",
    title: "Record Voice Journal",
    description: "Talk about your financial experiences, concerns, and goals in a natural, conversational way."
  },
  {
    number: "02",
    title: "AI Analyzes Emotions",
    description: "Our AI identifies stress signals and emotional patterns in your voice related to financial topics."
  },
  {
    number: "03",
    title: "Connect to Spending",
    description: "Link your financial accounts to see how your emotions correlate with your spending behaviors."
  },
  {
    number: "04",
    title: "Get Personalized Insights",
    description: "Receive insights and recommendations based on your unique emotional patterns and cultural context."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            How Incluya Works
          </h2>
          <p className="text-lg text-gray-700">
            Voice is the most natural way to share money stories, understand sentiments behind what is said, and build trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div 
                className={`h-full p-6 rounded-xl ${
                  index % 2 === 0 
                    ? "bg-incluya-turquoise/20" 
                    : "bg-incluya-yellow/20"
                }`}
              >
                <span className="block font-serif text-4xl font-bold text-incluya-text-dark opacity-20 mb-4">
                  {step.number}
                </span>
                <h3 className="font-serif text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-700">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
