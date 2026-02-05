import React from 'react';

export const Separator = ({ 
  variant = 'dash',
  className = '',
}) => {
  const variants = {
    dash: '─'.repeat(80),
    equals: '═'.repeat(80),
    dots: '·'.repeat(80),
    slash: '//'.repeat(40),
  };

  return (
    <div className={`text-terminal-muted overflow-hidden whitespace-nowrap ${className}`}>
      {variants[variant]}
    </div>
  );
};

export default Separator;
