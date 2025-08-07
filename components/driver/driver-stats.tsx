'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Users, 
  Star,
  MapPin,
  Car,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDriverStats } from '@/hooks/use-driver-stats';

export function DriverStats() {
  const { stats, loading, error, refreshStats } = useDriverStats();

  // Affichage de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
          <Button onClick={refreshStats} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground mt-2">
          Suivez vos performances et votre activité
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Note moyenne
            </CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur {stats.totalReviews} évaluation{stats.totalReviews > 1 ? 's' : ''}
            </p>
            <Progress value={(stats.averageRating / 5) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Missions du mois
            </CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthMissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.trends.missionsGrowth >= 0 ? '+' : ''}{stats.trends.missionsGrowth.toFixed(1)}% par rapport au mois dernier
            </p>
            <Progress value={Math.min((stats.thisMonthMissions / Math.max(stats.totalMissions, 1)) * 100, 100)} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Kilomètres parcourus
            </CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthKmTraveled.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.trends.kmGrowth >= 0 ? '+' : ''}{stats.trends.kmGrowth.toFixed(1)}% vs mois dernier
            </p>
            <Progress value={Math.min((stats.thisMonthKmTraveled / Math.max(stats.totalKmTraveled, 1)) * 100, 100)} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-primary" />
              <span>Activité hebdomadaire</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2">
              {stats.weeklyActivity.map((value, i) => {
                const maxValue = Math.max(...stats.weeklyActivity, 1);
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                // Hauteur minimale de 10px pour la visibilité, même si value = 0
                const minHeight = value > 0 ? Math.max(percentage, 10) : 5;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '260px' }}>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          value > 0 
                            ? 'bg-primary/20 hover:bg-primary/30 border border-primary/30' 
                            : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                        style={{ 
                          height: `${minHeight}px`,
                          minHeight: '5px'
                        }}
                        title={`${value} mission${value !== 1 ? 's' : ''} - ${['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i]}`}
                      />
                    </div>
                    <div className="text-xs text-center mt-2 text-muted-foreground font-medium">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                    </div>
                    <div className={`text-xs text-center font-bold ${
                      value > 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Message si aucune activité */}
            {stats.weeklyActivity.every(v => v === 0) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm font-medium">Aucune activité cette semaine</p>
                  <p className="text-xs mt-1">Les missions apparaîtront ici une fois effectuées</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Performance mensuelle</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Enfants transportés</span>
                  </div>
                  <span className="text-sm font-bold">{stats.totalChildrenTransported}</span>
                </div>
                <Progress value={Math.min((stats.totalChildrenTransported / Math.max(stats.totalChildrenTransported, 10)) * 100, 100)} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Satisfaction</span>
                  </div>
                  <span className="text-sm font-bold">{stats.averageRating.toFixed(1)}/5</span>
                </div>
                <Progress value={(stats.averageRating / 5) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}