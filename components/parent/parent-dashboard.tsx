'use client';

import { useState } from 'react';
import { 
  CalendarRange, 
  Map, 
  Clock, 
  Plus,
  Bell,
  UserRound,
  AlertTriangle,
  Star,
  ChevronRight,
  MessageSquare,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ParentCalendarView } from '@/components/parent/parent-calendar-view';
import { ParentChildListCard } from '@/components/parent/parent-child-list-card';
import { ParentUpcomingTrip } from '@/components/parent/parent-upcoming-trip';
import { FeaturedChildProfile } from '@/components/parent/featured-child-profile';

import { useRegion } from '@/hooks/use-region';
import { useDashboard } from '@/hooks/use-dashboard';

export function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Hook pour les données du dashboard
  const {
    stats,
    upcomingTrips,
    weeklySchedule,
    children,
    reviews,
    notifications,
    loading,
    error,
    markNotificationAsRead,
    getNextTrip,
    getFeaturedChild,
    getUnreadNotifications,
  } = useDashboard();
  
  // États pour les dialogues
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isThankDialogOpen, setIsThankDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{id: string; name: string} | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  // Gestionnaires d'événements
  const handleReply = (id: string, name: string) => {
    setSelectedReview({id, name});
    setIsReplyDialogOpen(true);
  };
  
  const handleThank = (id: string, name: string) => {
    setSelectedReview({id, name});
    setIsThankDialogOpen(true);
  };
  
  const handleSendReply = () => {
    toast({
      title: 'Réponse envoyée',
      description: `Votre réponse a été envoyée à ${selectedReview?.name}.`,
    });
    setIsReplyDialogOpen(false);
  };
  
  const handleSendThanks = () => {
    toast({
      title: 'Remerciement envoyé',
      description: `Votre message de remerciement a été envoyé à ${selectedReview?.name}.`,
    });
    setIsThankDialogOpen(false);
  };
  
  const handleViewChildProfile = () => {
    router.push('/parent/children/1');
  };

  const {
    regions,
    userRegion,
    loading: loadingRegions,
    dialogOpen,
    setRegionForUser
  } = useRegion();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  return (
    <>
      {/* Dialog de choix de région obligatoire */}
      <Dialog open={dialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisissez votre région</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Région</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedRegion || ''}
                onChange={e => setSelectedRegion(e.target.value)}
              >
                <option value="" disabled>Choisissez une région</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              disabled={!selectedRegion}
              onClick={() => selectedRegion && setRegionForUser(selectedRegion)}
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto pb-10"
      >
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Bonjour, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bienvenue sur votre tableau de bord de transport sécurisé
          </p>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-secondary/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  <Map className="h-4 w-4 text-primary" />
                </div>
                <span>Mission en cours</span>
              </CardTitle>
              <CardDescription>
                Suivez en temps réel le transport de votre enfant
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : getNextTrip() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{getNextTrip()?.childName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getNextTrip()?.scheduledTime.toLocaleDateString('fr-FR')} à {getNextTrip()?.scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{getNextTrip()?.driverName}</p>
                      <p className="text-xs text-muted-foreground">Chauffeur</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">Départ:</span>
                      <span>{getNextTrip()?.from.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-muted-foreground">Arrivée:</span>
                      <span>{getNextTrip()?.to.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Distance: {((getNextTrip()?.distance || 0) / 1000).toFixed(1)} km
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/parent/tracking')}
                      className="h-7 text-xs"
                    >
                      Suivre en temps réel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun trajet prévu aujourd&apos;hui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 order-1 lg:order-1">
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span>Planning de la semaine</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 sm:h-8 gap-1 text-xs"
                    onClick={() => router.push('/parent/calendar')}
                  >
                    <CalendarRange className="h-3.5 w-3.5 mr-1" />
                    <span>Voir tout</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ParentCalendarView 
            weeklySchedule={weeklySchedule} 
            loading={loading} 
          />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="order-3 lg:order-2">
            <FeaturedChildProfile 
              child={getFeaturedChild()} 
              loading={loading} 
            />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 order-2 lg:order-3">
            <ParentChildListCard 
              childrenData={children} 
              loading={loading} 
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-background to-secondary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20">
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Dernières évaluations</span>
                </div>
              </CardTitle>
              <CardDescription>
                Vos évaluations récentes de trajets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="received">Reçues</TabsTrigger>
                  <TabsTrigger value="given">Données</TabsTrigger>
                </TabsList>
                <TabsContent value="received" className="space-y-4">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : reviews.filter(r => r.type === 'received' && r.rating).length > 0 ? (
                      reviews.filter(r => r.type === 'received' && r.rating).map((review) => (
                        <div key={review.id} className="relative overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-0.5">
                          <div className="relative p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                                  {review.reviewerAvatar ? (
                                    <img src={review.reviewerAvatar} alt={review.reviewerName} className="h-10 w-10 rounded-full" />
                                  ) : (
                                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                      {review.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                  <div>
                                    <h4 className="text-sm font-semibold">{review.reviewerName}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-xs text-muted-foreground">
                                        {review.date.toLocaleDateString('fr-FR')} · {review.reviewerRole === 'driver' ? 'Chauffeur' : 'Parent'}
                                      </p>
                                      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-300">
                                        {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                      </span>
                                      {review.childName && (
                                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                          {review.childName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`h-3.5 w-3.5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                
                                {review.comment && (
                                  <div className="mt-2 text-sm">
                                    <p className="relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-primary/30">
                                      &quot;{review.comment}&quot;
                                    </p>
                                  </div>
                                )}
                                
                                {review.canReply && (
                                  <div className="flex items-center justify-end gap-2 mt-3">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:text-amber-800 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                      onClick={() => handleThank(review.id, review.reviewerName)}
                                    >
                                      <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                                      Remercier
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-[10px]"
                                      onClick={() => handleReply(review.id, review.reviewerName)}
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Répondre
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune évaluation reçue</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="given" className="space-y-4">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : reviews.filter(r => r.type === 'given').length > 0 ? (
                      reviews.filter(r => r.type === 'given').map((review) => (
                        <div key={review.id} className="relative overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-0.5">
                          <div className="relative p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name || 'Vous'} className="h-10 w-10 rounded-full" />
                                  ) : (
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                      {(user?.name || 'V').split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                  <div>
                                    <h4 className="text-sm font-semibold">Vous</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-xs text-muted-foreground">
                                        {review.date.toLocaleDateString('fr-FR')} · Parent
                                        {review.recipientName && (
                                          <span> · à {review.recipientName}</span>
                                        )}
                                      </p>
                                      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-300">
                                        {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                      </span>
                                      {review.childName && (
                                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                          {review.childName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {review.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star} 
                                          className={`h-3.5 w-3.5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`} 
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {review.comment && (
                                  <div className="mt-2 text-sm">
                                    <p className="relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-primary/30">
                                      &quot;{review.comment}&quot;
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune évaluation donnée</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Dialog pour répondre à une évaluation */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Répondre à {selectedReview?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Votre message
              </label>
              <textarea
                id="message"
                className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Merci pour votre évaluation..."
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReplyDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleSendReply}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour remercier */}
      <Dialog open={isThankDialogOpen} onOpenChange={setIsThankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remercier {selectedReview?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="thank-message" className="text-sm font-medium">
                Message de remerciement
              </label>
              <textarea
                id="thank-message"
                className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Merci beaucoup pour votre service exceptionnel..."
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsThankDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleSendThanks}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Star className="h-4 w-4 mr-2 fill-white" />
              Envoyer un remerciement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
