

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Workflow, MessageCircle, Activity, TreeDeciduous } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: MessageCircle,
      label: 'Talk',
      path: '/chat',
    },
    {
      icon: Activity,
      label: 'Check-In',
      path: '/calendar',
    },
    {
      icon: TreeDeciduous,
      label: 'Money Origin',
      path: '/money-tree',
    },
    {
      icon: Workflow,
      label: 'Insights',
      path: '/insights',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Liquid glass background with translucent effect */}
      <div className="mx-6 mb-3">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-xl backdrop-saturate-150">
          <div className="flex items-center justify-around py-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center py-1.5 w-20 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-white bg-white/20 scale-105' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-sans mt-0.5 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;

