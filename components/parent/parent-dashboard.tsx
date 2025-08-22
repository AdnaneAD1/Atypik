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
  Award,
  Navigation,
  Route
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
        <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Choisissez votre région
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">Région</label>
              <select
                className="w-full border-0 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="min-h-screen bg-background">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pt-8 pb-16"
        >
          {/* Header moderne */}
          <div className="space-y-2">
            <motion.h1 
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
            >
              Bonjour, {user?.name?.split(' ')[0]} 👋
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl"
            >
              Gérez le transport sécurisé de vos enfants en toute sérénité
            </motion.p>
          </div>

{/* Mission en cours - Redesign avec couleurs d'origine */}
<motion.div variants={itemVariants}>
  <Card className="border shadow-lg bg-card hover:shadow-xl transition-all duration-300 overflow-hidden">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
            <Navigation className="h-5 w-5 text-primary" />
            {/* Animation subtile de pulsation */}
            <motion.span 
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-1 rounded-xl bg-primary/20"
            ></motion.span>
          </div>
          <div>
            <span className="text-lg font-semibold">Mission Active</span>
            <p className="text-sm text-muted-foreground font-normal mt-0.5">Suivi en temps réel</p>
          </div>
        </CardTitle>
        {getNextTrip() && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            ></motion.div>
            En cours
          </motion.div>
        )}
      </div>
    </CardHeader>
    
    <CardContent className="pb-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-8 w-8 border-2 border-muted border-t-primary"
          ></motion.div>
        </div>
      ) : getNextTrip() ? (
        <div className="space-y-6">
          {/* Carte enfant et chauffeur */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12 rounded-xl border">
                  <AvatarImage 
                    src={(children.find(c => c.name === getNextTrip()?.childName)?.avatar) || ''}
                    alt={getNextTrip()?.childName || 'Enfant'} 
                  />
                  <AvatarFallback className="rounded-xl text-sm font-semibold">
                    {(getNextTrip()?.childName || 'EN')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{getNextTrip()?.childName}</h3>
                <p className="text-sm text-muted-foreground">
                  {getNextTrip()?.scheduledTime.toLocaleDateString('fr-FR', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })} à {getNextTrip()?.scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold">{getNextTrip()?.driverName}</p>
              <p className="text-sm text-muted-foreground">Chauffeur attitré</p>
            </div>
          </motion.div>
          
          {/* Trajet avec animation */}
          <div className="relative">
            {/* Ligne de connexion animée */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-green-400/30 to-red-400/30 rounded-full">
              <motion.div 
                animate={{ 
                  translateY: ["0%", "100%", "0%"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-full h-4 bg-gradient-to-b from-primary/50 to-primary rounded-full"
              ></motion.div>
            </div>
            
            <div className="space-y-4 relative">
              {/* Point de départ */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 pl-0"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl bg-green-200"
                  ></motion.div>
                </div>
                <div className="flex-1 p-3 bg-white rounded-xl border">
                  <p className="text-xs font-medium text-green-600 mb-1">DÉPART</p>
                  <p className="text-sm font-medium">{getNextTrip()?.from.address}</p>
                </div>
              </motion.div>
              
              {/* Point d'arrivée */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 pl-0"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center border border-red-200">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="absolute inset-0 rounded-xl bg-red-200"
                  ></motion.div>
                </div>
                <div className="flex-1 p-3 bg-white rounded-xl border">
                  <p className="text-xs font-medium text-red-600 mb-1">ARRIVÉE</p>
                  <p className="text-sm font-medium">{getNextTrip()?.to.address}</p>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Informations supplémentaires et bouton */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between pt-2"
          >
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                <span>{((getNextTrip()?.distance || 0) / 1000).toFixed(1)} km</span>
              </div>
            </div>
            
              <Button 
                onClick={() => router.push('/parent/tracking')}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Suivre en temps réel
              </Button>
            
              </motion.div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Aucun trajet en cours</h3>
          <p className="text-muted-foreground">Vous serez notifié dès qu&apos;une mission démarre</p>
        </motion.div>
      )}
    </CardContent>
  </Card>
</motion.div>

          {/* Grille principale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Planning - Plus large */}
            <motion.div variants={itemVariants} className="lg:col-span-2 order-1">
              <Card className="border shadow-md bg-card hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                        <CalendarRange className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-lg font-semibold">Planning Hebdomadaire</span>
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="transition-colors"
                      onClick={() => router.push('/parent/calendar')}
                    >
                      <CalendarRange className="h-4 w-4 mr-2" />
                      Voir plus
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ParentCalendarView 
                    weeklySchedule={weeklySchedule} 
                    loading={loading} 
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Profil enfant */}
            <motion.div variants={itemVariants} className="order-2">
              <FeaturedChildProfile 
                child={getFeaturedChild()} 
                loading={loading} 
              />
            </motion.div>
          </div>

          {/* Liste des enfants */}
          <motion.div variants={itemVariants}>
            <ParentChildListCard 
              childrenData={children} 
              loading={loading} 
            />
          </motion.div>

          {/* Évaluations - Redesignées */}
          <motion.div variants={itemVariants}>
            <Card className="border shadow-md bg-card hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Évaluations</span>
                    <p className="text-sm text-muted-foreground font-normal mt-0.5">Vos retours et avis</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="received" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="received">
                      Reçues
                    </TabsTrigger>
                    <TabsTrigger value="given">
                      Données
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="received" className="space-y-4">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
                        </div>
                      ) : reviews.filter(r => r.type === 'received' && r.rating).length > 0 ? (
                        reviews.filter(r => r.type === 'received' && r.rating).map((review) => (
                          <div key={review.id} className="group relative overflow-hidden rounded-xl border bg-card/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                                    {review.reviewerAvatar ? (
                                      <img src={review.reviewerAvatar} alt={review.reviewerName} className="h-12 w-12 rounded-xl object-cover" />
                                    ) : (
                                      <span className="text-sm font-semibold text-foreground">
                                        {review.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-semibold text-base">{review.reviewerName}</h4>
                                      <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-muted-foreground">
                                          {review.date.toLocaleDateString('fr-FR')} · {review.reviewerRole === 'driver' ? 'Chauffeur' : 'Parent'}
                                        </p>
                                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium border border-green-200">
                                          {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                        </span>
                                        {review.childName && (
                                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium border border-blue-200">
                                            {review.childName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star} 
                                          className={`h-4 w-4 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {review.comment && (
                                    <div className="mb-4">
                                      <div className="p-4 bg-muted/20 rounded-xl border">
                                        <p className="text-sm italic leading-relaxed">
                                          &quot;{review.comment}&quot;
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {review.canReply && (
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 transition-colors dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 dark:border-amber-800"
                                        onClick={() => handleThank(review.id, review.reviewerName)}
                                      >
                                        <Star className="h-3.5 w-3.5 mr-2 fill-amber-400 text-amber-400" />
                                        Remercier
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="transition-colors"
                                        onClick={() => handleReply(review.id, review.reviewerName)}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5 mr-2" />
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
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto mb-4">
                            <Star className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                          </div>
                          <h3 className="font-semibold mb-2">Aucune évaluation reçue</h3>
                          <p className="text-muted-foreground">Les évaluations apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="given" className="space-y-4">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
                        </div>
                      ) : reviews.filter(r => r.type === 'given').length > 0 ? (
                        reviews.filter(r => r.type === 'given').map((review) => (
                          <div key={review.id} className="group relative overflow-hidden rounded-xl border bg-card/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                                    {user?.avatar ? (
                                      <img src={user.avatar} alt={user.name || 'Vous'} className="h-12 w-12 rounded-xl object-cover" />
                                    ) : (
                                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {(user?.name || 'V').split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-semibold text-base">Vous</h4>
                                      <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-muted-foreground">
                                          {review.date.toLocaleDateString('fr-FR')} · Parent
                                          {review.recipientName && (
                                            <span> · à {review.recipientName}</span>
                                          )}
                                        </p>
                                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium border border-green-200">
                                          {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                        </span>
                                        {review.childName && (
                                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium border border-blue-200">
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
                                            className={`h-4 w-4 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {review.comment && (
                                    <div className="p-4 bg-muted/30 rounded-xl border">
                                      <div className="p-4 bg-muted/20 rounded-xl border">
                                        <p className="text-sm italic leading-relaxed">
                                          &quot;{review.comment}&quot;
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto mb-4">
                            <Award className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                          </div>
                          <h3 className="font-semibold mb-2">Aucune évaluation donnée</h3>
                          <p className="text-muted-foreground">Vos évaluations apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      </div>
      
      {/* Dialogues modernisés */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Répondre à {selectedReview?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <label htmlFor="message" className="text-sm font-medium">
                Votre message
              </label>
              <textarea
                id="message"
                className="flex h-28 w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                placeholder="Merci pour votre évaluation..."
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleSendReply}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isThankDialogOpen} onOpenChange={setIsThankDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Remercier {selectedReview?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <label htmlFor="thank-message" className="text-sm font-medium">
                Message de remerciement
              </label>
              <textarea
                id="thank-message"
                className="flex h-28 w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                placeholder="Merci beaucoup pour votre service exceptionnel..."
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsThankDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleSendThanks}
              className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
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