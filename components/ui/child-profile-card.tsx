'use client';

import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, ChevronRight, Smile, Activity, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChildProfileCardProps {
  child: {
    id: string;
    name: string;
    initials: string;
    school: string;
    rating: number;
    about: string;
    specialNeeds: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
      icon: 'heartPulse' | 'activity' | 'other';
    }>;
  };
  className?: string;
  onViewProfile?: (id: string) => void;
}

export function ChildProfileCard({ child, className, onViewProfile }: ChildProfileCardProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'heartPulse':
        return <HeartPulse className="h-4 w-4" />;
      case 'activity':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50/50 border-red-100 text-red-600';
      case 'medium':
        return 'bg-amber-50/50 border-amber-100 text-amber-600';
      case 'low':
        return 'bg-blue-50/50 border-blue-100 text-blue-600';
      default:
        return 'bg-gray-50/50 border-gray-100 text-gray-600';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100';
      case 'medium':
        return 'bg-amber-100';
      case 'low':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-xl shadow-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden',
        className
      )}
    >
      <div className="h-2 bg-primary" />
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-sm">
              {child.initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{child.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {child.school}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            {child.rating}
          </div>
        </div>
        
        <div className="space-y-5">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Smile className="h-4 w-4" />
              <h4 className="text-sm font-semibold">À propos</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {child.about}
            </p>
          </div>
          
          {/* Special Needs */}
          {child.specialNeeds.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Besoins spécifiques</h4>
              </div>
              <div className="grid gap-3">
                {child.specialNeeds.map((need) => (
                  <div 
                    key={need.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(need.severity)}`}
                  >
                    <div className={`p-2 rounded-lg ${getSeverityBgColor(need.severity)}`}>
                      {getIconComponent(need.icon)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{need.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{need.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Button */}
          <Button 
            variant="ghost" 
            className="w-full mt-2 text-primary hover:bg-primary/5"
            onClick={() => onViewProfile?.(child.id)}
          >
            Voir fiche complète <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
