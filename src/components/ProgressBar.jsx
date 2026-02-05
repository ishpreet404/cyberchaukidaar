import React from 'react';

export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  showPercentage = true,
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    default: 'bg-terminal-green',
    warning: 'bg-terminal-amber',
    danger: 'bg-terminal-red',
  };

  const bars = Math.floor(percentage / 5);
  const emptyBars = 20 - bars;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="progress-bar">
        <div 
          className={`progress-fill ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-terminal-green font-mono">
          [{"|".repeat(bars)}{".".repeat(emptyBars)}] {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
