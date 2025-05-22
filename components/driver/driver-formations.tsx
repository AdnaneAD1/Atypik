'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap,
  Play,
  Clock,
  CheckCircle,
  BookOpen,
  Award,
  Brain,
  Heart
} from 'lucide-react';

export function DriverFormations() {
  // Mock formations data
  const formations = [
    {
      id: '1',
      title: 'Gestion des enfants TDAH',
      description: 'Apprenez à accompagner les enfants atteints de TDAH pendant les trajets.',
      duration: '2h30',
      progress: 75,
      status: 'in-progress',
      icon: Brain
    },
    {
      id: '2',
      title: 'Premiers secours pédiatriques',
      description: 'Formation aux gestes de premiers secours adaptés aux enfants.',
      duration: '4h',
      progress: 100,
      status: 'completed',
      icon: Heart
    },
    {
      id: '3',
      title: 'Sécurité routière avancée',
      description: 'Perfectionnement à la conduite sécurisée avec des enfants.',
      duration: '3h',
      progress: 0,
      status: 'not-started',
      icon: Award
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Formations</h1>
        <p className="text-muted-foreground mt-2">
          Développez vos compétences et restez à jour
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Mes formations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formations.map((formation) => (
              <div
                key={formation.id}
                className="p-4 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <formation.icon className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{formation.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formation.description}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "bg-primary/5 text-primary border-primary/20",
                          formation.status === 'completed' && "bg-success/5 text-success border-success/20"
                        )}
                      >
                        {formation.status === 'completed' ? 'Terminée' :
                         formation.status === 'in-progress' ? 'En cours' :
                         'À commencer'}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formation.duration}</span>
                        </div>
                        <span className="font-medium">
                          {formation.progress}%
                        </span>
                      </div>

                      <Progress value={formation.progress} className="h-2" />

                      <div className="flex justify-end">
                        <Button
                          variant={formation.status === 'completed' ? 'outline' : 'default'}
                          size="sm"
                          className={cn(
                            "text-xs",
                            formation.status !== 'completed' && "bg-primary hover:bg-primary/90"
                          )}
                        >
                          {formation.status === 'completed' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Revoir
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              {formation.status === 'in-progress' ? 'Continuer' : 'Commencer'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Certifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Transport adapté</h4>
                  <p className="text-sm text-muted-foreground">
                    Validée le 15/01/2024
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Premiers secours</h4>
                  <p className="text-sm text-muted-foreground">
                    Validée le 20/02/2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}