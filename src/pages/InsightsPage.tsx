
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const InsightsPage = () => {
  const insights = [
    {
      id: 1,
      title: "You've been spending (~$330 more on retail) since your sleep dropped and you mentioned a breakup.",
      bgColor: 'bg-gradient-to-br from-amber-200 to-orange-300'
    },
    {
      id: 2,
      title: 'Feeling off lately?',
      subtitle: "You haven't said much, but your recent chat hints at a breakup.",
      bgColor: 'bg-gray-800'
    },
    {
      id: 3,
      title: "Spending's up by ~$300 especially on comfort retail buys.",
      subtitle: "That's okay.",
      bgColor: 'bg-gray-800'
    },
    {
      id: 4,
      title: 'Sleep is down.',
      subtitle: 'Rest hasn\'t been easy.',
      bgColor: 'bg-gray-800'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-6">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={`${insight.bgColor} border-0 hover:scale-[1.02] transition-all duration-300 cursor-pointer h-48`}
            >
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <h3 className="text-white font-medium text-lg leading-relaxed mb-2">
                  {insight.title}
                </h3>
                {insight.subtitle && (
                  <p className="text-white/70 text-sm">
                    {insight.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
