
import React from 'react';

const ChatHeader: React.FC = () => {
  return (
    <div className="pt-2 pb-1.5 flex justify-between items-center px-[16px] py-[8px]">
      <div className="flex items-center gap-3">
        <img src="/lovable-uploads/dc796d96-cbad-4610-b735-c58ee884fec4.png" alt="Logo" className="w-6 h-6 md:hidden" />
        <span className="text-white tracking-wide font-light font-dm-sans text-lg">Your Money Origin Story.</span>
      </div>
    </div>
  );
};

export default ChatHeader;
