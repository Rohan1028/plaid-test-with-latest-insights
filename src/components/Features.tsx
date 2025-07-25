
import React from 'react';
import { MessageSquare, TrendingUp, Heart, User } from 'lucide-react';
import VideoBackgroundFeatures from '@/components/VideoBackgroundFeatures';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-incluya-yellow/30 hover:shadow-md transition-all">
      <div className="rounded-full bg-incluya-yellow/20 w-12 h-12 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-incluya-yellow-dark" />
      </div>
      <h3 className="font-serif text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Voice Journaling",
      description: "Record your thoughts about money in the most natural way - your voice. Share your money stories and experiences."
    },
    {
      icon: TrendingUp,
      title: "Financial Tracking",
      description: "Track your spending patterns and see how they correlate with your emotional states and cultural money patterns."
    },
    {
      icon: Heart,
      title: "Emotional Analysis",
      description: "Our AI analyzes voice memos for stress signals and helps you understand the emotions driving your financial decisions."
    },
    {
      icon: User,
      title: "Cultural Context",
      description: "Adapts to your unique cultural background and helps you break inherited patterns that may be causing financial stress."
    }
  ];

  return (
    <section id="features" className="py-20 bg-incluya-cream relative overflow-hidden">
      <VideoBackgroundFeatures />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            Financial Wellness That Goes Beyond Numbers
          </h2>
          <p className="text-lg text-gray-700">
            Traditional financial tools track numbers but ignore human nature - the emotions and 
            cultural patterns driving 90% of money decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
