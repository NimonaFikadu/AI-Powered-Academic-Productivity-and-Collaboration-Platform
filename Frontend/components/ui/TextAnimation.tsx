"use client";
import React, { useState, useEffect } from 'react';

interface TextAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  batchSize?: number;
}

const TextAnimation: React.FC<TextAnimationProps> = ({ 
  text, 
  speed = 5,
  onComplete,
  batchSize = 4
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        const nextIndex = Math.min(index + batchSize, text.length);
        const nextChunk = text.substring(index, nextIndex);
        setDisplayedText(prev => prev + nextChunk);
        setIndex(nextIndex);
      }, speed);
      return () => clearTimeout(timer);
    } else if (!completed) {
      setCompleted(true);
      if (onComplete) onComplete();
    }
  }, [index, text, speed, completed, onComplete, batchSize]);

  return <span>{displayedText}</span>;
};

export default TextAnimation; 