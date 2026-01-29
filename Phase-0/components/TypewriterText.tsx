import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  repeat?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  className = '', 
  speed = 50, 
  tag: Tag = 'div',
  repeat = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Reset logic when scrolling out of view
  useEffect(() => {
    if (!isVisible && repeat) {
      setDisplayedText('');
      setHasCompleted(false);
    }
  }, [isVisible, repeat]);

  // Typing logic
  useEffect(() => {
    let interval: any;

    // Start typing if visible and not yet completed (or if repeating and reset happened)
    if (isVisible && !hasCompleted) {
      setDisplayedText(''); // Start fresh
      let currentIndex = 0;
      
      interval = setInterval(() => {
        if (currentIndex >= text.length) {
          clearInterval(interval);
          setHasCompleted(true);
          setDisplayedText(text); // Ensure full text matches exactly
        } else {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        }
      }, speed);
    } 
    // If visible and completed (and repeat=false), we do nothing, text remains.
    
    return () => clearInterval(interval);
  }, [isVisible, hasCompleted, text, speed]);

  return (
    <Tag ref={elementRef as any} className={`${className} inline-flex flex-wrap`}>
      <span>{displayedText}</span>
      <span className={`inline-block w-2 h-[1em] ml-1 bg-blue-500 animate-pulse ${displayedText.length === text.length ? 'opacity-0' : 'opacity-100'} align-middle`}></span>
    </Tag>
  );
};

export default TypewriterText;