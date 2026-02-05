import React from 'react';

export const Card = ({ 
  children, 
  title, 
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`terminal-window ${className}`}>
      {title && (
        <div className={`terminal-window-header ${headerClassName}`}>
          {title}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
