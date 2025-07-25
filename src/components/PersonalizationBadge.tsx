import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageCircle, Heart, TrendingUp, Brain } from 'lucide-react';

interface PersonalizationBadgeProps {
  dataSources: string[];
  className?: string;
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'mem0':
      return <Brain size={12} />;
    case 'chat':
      return <MessageCircle size={12} />;
    case 'intake':
      return <Heart size={12} />;
    case 'interventions':
      return <TrendingUp size={12} />;
    default:
      return <Sparkles size={12} />;
  }
};

const getSourceLabel = (source: string) => {
  switch (source.toLowerCase()) {
    case 'mem0':
      return 'Memory Insights';
    case 'chat':
      return 'Chat History';
    case 'intake':
      return 'Initial Questions';
    case 'interventions':
      return 'Completed Activities';
    default:
      return source;
  }
};

export const PersonalizationBadge: React.FC<PersonalizationBadgeProps> = ({ 
  dataSources, 
  className = '' 
}) => {
  if (dataSources.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {dataSources.map((source, index) => (
        <Badge 
          key={index}
          variant="secondary" 
          className="bg-white/10 text-white/80 border-white/20 text-xs flex items-center gap-1 backdrop-blur-sm"
        >
          {getSourceIcon(source)}
          {getSourceLabel(source)}
        </Badge>
      ))}
    </div>
  );
}; 