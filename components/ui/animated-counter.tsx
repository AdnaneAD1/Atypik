'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimalPlaces?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  delay = 0.2,
  prefix = '',
  suffix = '',
  className = '',
  decimalPlaces = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const controls = useAnimation();
  
  // Convert string value to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN values
  const finalValue = isNaN(numericValue) ? 0 : numericValue;
  
  useEffect(() => {
    let startTimestamp: number;
    let animationFrameId: number;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing function for a more natural animation
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = easedProgress * finalValue;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    
    // Delay the start of the animation
    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [finalValue, duration, delay]);
  
  // Format the display value based on decimal places
  const formattedValue = decimalPlaces > 0
    ? displayValue.toFixed(decimalPlaces)
    : Math.round(displayValue).toString();
  
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
}
