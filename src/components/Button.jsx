import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  className = '',
  disabled = false,
  ...props 
}) => {
  const variants = {
    default: 'terminal-button',
    primary: 'terminal-button border-terminal-green text-terminal-green hover:bg-terminal-green shadow-[0_0_10px_rgba(51,255,0,0.3)]',
    danger: 'terminal-button border-terminal-red text-terminal-red hover:bg-terminal-red',
    warning: 'terminal-button border-terminal-amber text-terminal-amber hover:bg-terminal-amber',
    secondary: 'terminal-button border-terminal-muted text-terminal-muted hover:bg-terminal-muted',
  };

  return (
    <button
      className={`${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
