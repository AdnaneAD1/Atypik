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
  // Aucune formation disponible pour le moment
  const formations = [];

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
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucune formation disponible</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Les formations seront bientôt disponibles pour vous aider à développer vos compétences et améliorer votre service.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Nouvelles formations à venir prochainement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card>
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
      </Card> */}
    </div>
  );
}