'use client';

import { motion } from 'framer-motion';
import { Car, MapPin } from 'lucide-react';

interface SimpleRouteProps {
  progress: number;
  className?: string;
}

export function SimpleRoute({ progress, className }: SimpleRouteProps) {
  return (
    <div className={`relative h-24 ${className}`}>
      {/* Ligne de base */}
      <div className="absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      
      {/* Ligne de progression */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute left-1/2 -translate-x-1/2 w-1 bg-primary rounded-full origin-top"
      ></motion.div>
      
      {/* Point de départ */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="h-4 w-4 rounded-full bg-green-500 shadow-md"></div>
      </div>
      
      {/* Véhicule */}
      <motion.div 
        initial={{ top: 0 }}
        animate={{ top: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute left-1/2 -translate-x-1/2 z-20"
        style={{ top: `${progress}%` }}
      >
        <Car className="h-5 w-5 -ml-2.5 text-primary" />
      </motion.div>
      
      {/* Point d'arrivée */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
        <div className="h-4 w-4 rounded-full bg-red-500 shadow-md"></div>
      </div>
    </div>
  );
}
