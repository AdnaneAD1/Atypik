'use client';

import { motion } from 'framer-motion';
import { Car, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyTrackerProps {
  startPoint: string;
  startAddress: string;
  endPoint: string;
  endAddress: string;
  progress: number;
  startTime?: string;
  endTime?: string;
  completed?: boolean;
  className?: string;
}

export function JourneyTracker({
  startPoint,
  startAddress,
  endPoint,
  endAddress,
  progress,
  startTime,
  endTime,
  completed = false,
  className
}: JourneyTrackerProps) {
  return (
    <div className={cn("p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700", className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trajet en cours</h4>
        <div className="bg-primary/10 px-3 py-1 rounded-full">
          <p className="text-xs font-bold text-primary">{progress}%</p>
        </div>
      </div>
      
      <div className="flex items-start gap-6">
        {/* Timeline */}
        <div className="relative flex flex-col items-center">
          {/* Start point */}
          <div className="z-10 flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          
          {/* Track */}
          <div className="relative w-1 bg-gray-200 dark:bg-gray-700 h-[100px]">
            {/* Progress */}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-0 left-0 w-full bg-primary"
            />
            
            {/* Vehicle */}
            <motion.div
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: `${progress}%`, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute -left-3 z-20"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary shadow-md">
                <Car className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          </div>
          
          {/* End point */}
          <div className="z-10 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-500">
            <MapPin className="w-4 h-4 text-red-600" />
          </div>
        </div>
        
        {/* Journey details */}
        <div className="flex-1 space-y-8">
          {/* Start point details */}
          <div className="space-y-1">
            <h5 className="text-sm font-medium flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              {startPoint}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400">{startAddress}</p>
            {startTime && (
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Départ: {startTime}
              </p>
            )}
          </div>
          
          {/* End point details */}
          <div className="space-y-1">
            <h5 className="text-sm font-medium flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              {endPoint}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400">{endAddress}</p>
            {endTime && (
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Arrivée prévue: {endTime}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
