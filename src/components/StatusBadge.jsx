import React from 'react';

export const StatusBadge = ({ 
  status = 'ok', 
  children,
  className = '',
}) => {
  const statusClasses = {
    ok: 'status-ok',
    error: 'status-err',
    warning: 'status-warn',
  };

  return (
    <span className={`${statusClasses[status]} ${className}`}>
      {children}
    </span>
  );
};

export default StatusBadge;
