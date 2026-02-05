import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label, 
  prompt = '$',
  className = '',
  containerClassName = '',
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className={`flex items-center gap-2 ${containerClassName}`}>
      {label && <span className="text-terminal-green">{label}</span>}
      <span className="text-terminal-green">{prompt}</span>
      <input
        ref={ref}
        type={type}
        className={`terminal-input flex-1 ${className}`}
        {...props}
      />
      <span className="cursor"></span>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
