'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './animated-counter';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  bgColor?: string;
  iconColor?: string;
  suffix?: string;
  prefix?: string;
  decimalPlaces?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  bgColor = 'bg-primary/5 dark:bg-primary/10',
  iconColor = 'text-primary',
  suffix = '',
  prefix = '',
  decimalPlaces = 0,
  className
}: StatsCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-full', bgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
        </div>
        {trend && trendValue && (
          <div className={cn('text-xs font-medium flex items-center gap-1', getTrendColor())}>
            <span>{getTrendIcon()}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          <AnimatedCounter 
            value={value} 
            duration={1.8} 
            delay={0.3}
            prefix={prefix}
            suffix={suffix}
            decimalPlaces={decimalPlaces}
          />
        </h2>
      </div>
    </motion.div>
  );
}
