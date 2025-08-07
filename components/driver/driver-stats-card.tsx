'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, BarChart, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';
import { DriverStats } from '@/hooks/use-driver-dashboard';

interface DriverStatsCardProps {
  stats: DriverStats;
  loading?: boolean;
  error?: string | null;
}

export function DriverStatsCard({ stats, loading = false, error = null }: DriverStatsCardProps) {

  // Affichage de chargement
  if (loading) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 rounded-xl border-t-4 border-t-primary">
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Chargement des statistiques...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 rounded-xl border-t-4 border-t-primary">
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-muted-foreground text-sm">Erreur lors du chargement</p>
            <p className="text-sm text-muted-foreground">Veuillez recharger la page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 rounded-xl border-t-4 border-t-primary">
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20">
              <BarChart className="h-5 w-5 text-primary dark:text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg whitespace-nowrap">Statistiques</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary dark:text-primary" /> 
                Performance et activité
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-yellow-50/50 dark:from-background dark:to-yellow-900/5 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-800/20 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 shadow-sm">
                  <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Note moyenne</span>
              </div>
              <div className="flex items-center">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl font-bold text-yellow-700 dark:text-yellow-400"
                >
                  <AnimatedCounter value={stats.averageRating} duration={2} decimalPlaces={1} />
                </motion.span>
                <span className="text-xs font-medium text-yellow-600/70 dark:text-yellow-500/70 ml-1 mt-2">/5</span>
              </div>
            </div>
            
            <div className="relative h-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(stats.averageRating / 5) * 100}%` }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
              ></motion.div>
            </div>
            
            <div className="flex justify-between mt-2">
              <p className="text-xs text-yellow-600/80 dark:text-yellow-500/80">
                Note moyenne
              </p>
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                {stats.averageRating >= 4.5 ? 'Excellent' : stats.averageRating >= 4 ? 'Très bien' : stats.averageRating >= 3.5 ? 'Bien' : 'Correct'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500"></span>
              Cette semaine
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-white to-teal-50/50 dark:from-background dark:to-teal-900/5 p-4 rounded-xl border border-teal-200/50 dark:border-teal-800/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">M</span>
                  </div>
                  <p className="text-xs font-medium text-teal-700 dark:text-teal-400">Missions</p>
                </div>
                <div className="flex items-baseline">
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-2xl font-bold text-teal-700 dark:text-teal-400"
                  >
                    <AnimatedCounter value={stats.todayMissions} duration={1.5} delay={0.6} />
                  </motion.p>
                  <p className="text-xs font-medium text-teal-600/70 dark:text-teal-500/70 ml-2">
                    Missions d'aujourd'hui
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-teal-50/50 dark:from-background dark:to-teal-900/5 p-4 rounded-xl border border-teal-200/50 dark:border-teal-800/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">KM</span>
                  </div>
                  <p className="text-xs font-medium text-teal-700 dark:text-teal-400">Km parcourus</p>
                </div>
                <div className="flex items-baseline">
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-2xl font-bold text-teal-700 dark:text-teal-400"
                  >
                    <AnimatedCounter value={stats.kmTraveled} duration={2} delay={0.8} decimalPlaces={1} />
                  </motion.p>
                  <p className="text-xs font-medium text-teal-600/70 dark:text-teal-500/70 ml-2">
                    Kilomètres parcourus
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </CardContent>
    </Card>
  );
}