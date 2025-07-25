
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Activity, Workflow, TreeDeciduous, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ChatSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine background color based on current route
  const getSidebarBackground = () => {
    if (location.pathname === '/calendar') {
      return '#030003';
    }
    if (location.pathname === '/money-tree') {
      return '#1B2410'; // Updated darker olive green for Money Origin
    }
    return '#152124';
  };

  return (
    <div className="w-48 h-screen border-r border-gray-800/50 flex flex-col backdrop-blur-sm" style={{
      backgroundColor: getSidebarBackground()
    }}>
      {/* Logo */}
      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/dc796d96-cbad-4610-b735-c58ee884fec4.png" alt="incluya logo" className="w-8 h-8 object-contain" />
          <span className="text-base tracking-widest font-roboto-slab font-normal text-slate-100">incluya</span>
        </div>
      </div>

      {/* Navigation - Centered */}
      <nav className="flex-1 flex flex-col justify-center px-2">
        <div className="space-y-1">
          <button onClick={() => navigate('/chat')} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-dm-sans font-medium transition-all duration-200 ${isActive('/chat') ? 'bg-white/5 text-white shadow-sm' : 'text-gray-300/60 hover:text-white hover:bg-white/5'}`}>
            <MessageCircle size={18} className={`flex-shrink-0 ${isActive('/chat') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="truncate font-normal">Talk</span>
          </button>

          <button onClick={() => navigate('/calendar')} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-dm-sans font-medium transition-all duration-200 ${isActive('/calendar') ? 'bg-white/5 text-white shadow-sm' : 'text-gray-300/60 hover:text-white hover:bg-white/5'}`}>
            <Activity size={18} className={`flex-shrink-0 ${isActive('/calendar') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="truncate font-normal">Check-In</span>
          </button>

          <button onClick={() => navigate('/money-tree')} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-dm-sans font-medium transition-all duration-200 ${isActive('/money-tree') ? 'bg-white/5 text-white shadow-sm' : 'text-gray-300/60 hover:text-white hover:bg-white/5'}`}>
            <TreeDeciduous size={18} className={`flex-shrink-0 ${isActive('/money-tree') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="truncate font-normal">Money Origin</span>
          </button>

          <button onClick={() => navigate('/insights')} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-dm-sans font-medium transition-all duration-200 ${isActive('/insights') ? 'bg-white/5 text-white shadow-sm' : 'text-gray-300/60 hover:text-white hover:bg-white/5'}`}>
            <Workflow size={18} className={`flex-shrink-0 ${isActive('/insights') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="truncate font-normal">Insights</span>
          </button>
          <button onClick={() => navigate('/plaid-transactions')} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-dm-sans font-medium transition-all duration-200 ${isActive('/plaid-transactions') ? 'bg-white/5 text-white shadow-sm' : 'text-gray-300/60 hover:text-white hover:bg-white/5'}`}>
            <CreditCard size={18} className={`flex-shrink-0 ${isActive('/plaid-transactions') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="truncate font-normal">Plaid Transactions</span>
          </button>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-gray-800/50">
        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-300/60 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-dm-sans font-medium">
          <LogOut size={18} className="flex-shrink-0 opacity-60" />
          <span className="truncate font-normal">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
