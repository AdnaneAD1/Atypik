'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';

interface SimpleStatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimalPlaces?: number;
  className?: string;
}

export function SimpleStat({
  icon: Icon,
  label,
  value,
  suffix = '',
  prefix = '',
  decimalPlaces = 0,
  className
}: SimpleStatProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold">
            <AnimatedCounter 
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimalPlaces={decimalPlaces}
              duration={1.5}
            />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
