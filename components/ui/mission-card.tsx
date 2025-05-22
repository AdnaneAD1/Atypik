'use client';

import { motion } from 'framer-motion';
import { Clock, MapPin, User, AlertTriangle, CheckCircle2, Navigation, Phone, Car } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MissionCardProps {
  mission: {
    id: string;
    time: string;
    child: {
      name: string;
      age: number;
      avatar: string | null;
      needs: string[];
    };
    from: {
      name: string;
      address: string;
    };
    to: {
      name: string;
      address: string;
    };
  };
  className?: string;
  onViewDetails?: (id: string) => void;
}

export function MissionCard({ mission, className, onViewDetails }: MissionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800',
        className
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
            <AvatarImage src={mission.child.avatar || undefined} alt={mission.child.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {mission.child.name[0]}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-sm font-semibold">{mission.child.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <User className="h-3 w-3 text-primary" />
              {mission.child.age} ans
            </p>
          </div>
        </div>
        
        <div className="bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-full">
          <p className="text-xs font-semibold text-primary flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {mission.time}
          </p>
        </div>
      </div>
      
      {mission.child.needs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mission.child.needs.map((need, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className="text-[10px] h-5 py-0 px-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 font-medium"
            >
              {need}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{mission.from.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{mission.from.address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-red-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{mission.to.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{mission.to.address}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs font-medium bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
          onClick={() => onViewDetails?.(mission.id)}
        >
          <Navigation className="h-3.5 w-3.5 mr-1.5" />
          Voir détails
        </Button>
      </div>
    </motion.div>
  );
}
