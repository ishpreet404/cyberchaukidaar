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
    danger: 'terminal-button border-terminal-red text-terminal-red hover:bg-terminal-red',
    warning: 'terminal-button border-terminal-amber text-terminal-amber hover:bg-terminal-amber',
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
