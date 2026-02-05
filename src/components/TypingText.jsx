import React, { useState, useEffect } from 'react';

export const TypingText = ({ 
  text, 
  speed = 50, 
  onComplete,
  showCursor = true,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={`${className}`}>
      {displayedText}
      {showCursor && currentIndex < text.length && <span className="cursor"></span>}
    </span>
  );
};

export default TypingText;
