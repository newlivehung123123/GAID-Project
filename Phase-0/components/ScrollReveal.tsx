import React, { useRef, useState, useEffect } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  staggerIndex?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  staggerIndex = 0,
  threshold = 0.1,
  triggerOnce = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // If triggerOnce is enabled, stop observing after first reveal
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        } else {
          // Only hide (reset animation) if triggerOnce is false
          if (!triggerOnce) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold: threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce]);

  const baseDelay = isVisible ? delay + (staggerIndex * 100) : 0; // Reduced stagger multiplier to 100ms

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${baseDelay}ms` }}
      className={`transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform will-change-transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 blur-0'
          : 'opacity-0 translate-y-8 scale-95 blur-sm'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;