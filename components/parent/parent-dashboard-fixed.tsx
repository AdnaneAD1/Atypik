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

export function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // u00c9tats pour les dialogues
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
  
  // Gestionnaires d'u00e9vu00e9nements
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
      title: 'Ru00e9ponse envoyu00e9e',
      description: `Votre ru00e9ponse a u00e9tu00e9 envoyu00e9e u00e0 ${selectedReview?.name}.`,
    });
    setIsReplyDialogOpen(false);
  };
  
  const handleSendThanks = () => {
    toast({
      title: 'Remerciement envoyu00e9',
      description: `Votre message de remerciement a u00e9tu00e9 envoyu00e9 u00e0 ${selectedReview?.name}.`,
    });
    setIsThankDialogOpen(false);
  };
  
  const handleViewChildProfile = () => {
    router.push('/parent/children/1');
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto pb-10"
      >
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Bonjour, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bienvenue sur votre tableau de bord de transport su00e9curisu00e9
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
                Suivez en temps ru00e9el le transport de votre enfant
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <ParentUpcomingTrip />
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
                    <span className="text-sm sm:text-base">Planning de la semaine</span>
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
                <ParentCalendarView />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="order-3 lg:order-2">
            <FeaturedChildProfile onViewDetails={handleViewChildProfile} />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 order-2 lg:order-3">
            <ParentChildListCard />
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
                  <span>Derniu00e8res u00e9valuations</span>
                </div>
              </CardTitle>
              <CardDescription>
                Vos u00e9valuations ru00e9centes de trajets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="received">Reu00e7ues</TabsTrigger>
                  <TabsTrigger value="given">Donnu00e9es</TabsTrigger>
                </TabsList>
                <TabsContent value="received" className="space-y-4">
                  <div className="space-y-4">
                    {/* Premiu00e8re u00e9valuation reu00e7ue */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-0.5">
                      <div className="relative p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">TD</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <div>
                                <h4 className="text-sm font-semibold">Thomas Durand</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-muted-foreground">10 juin · Chauffeur</p>
                                  <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-300">
                                    Retour
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3.5 w-3.5 ${star <= 5 ? "text-amber-400 fill-amber-400" : "text-muted"}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <p className="relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-primary/30">
                                &quot;Lucas a u00e9tu00e9 tru00e8s calme pendant le trajet. Il a beaucoup discutu00e9 de son nouveau jeu vidu00e9o.&quot;
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:text-amber-800 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                onClick={() => handleThank('1', 'Thomas Durand')}
                              >
                                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                                Remercier
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px]"
                                onClick={() => handleReply('1', 'Thomas Durand')}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Ru00e9pondre
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Deuxiu00e8me u00e9valuation reu00e7ue */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-0.5">
                      <div className="relative p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">ML</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <div>
                                <h4 className="text-sm font-semibold">Marie Leroy</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-muted-foreground">9 juin · Chauffeur</p>
                                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                    Aller
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3.5 w-3.5 ${star <= 4 ? "text-amber-400 fill-amber-400" : "text-muted"}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <p className="relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-purple-300 dark:before:bg-purple-700">
                                &quot;Lu00e9a u00e9tait un peu anxieuse ce matin mais s&apos;est du00e9tendue apru00e8s quelques minutes.&quot;
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:text-amber-800 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                onClick={() => handleThank('2', 'Marie Leroy')}
                              >
                                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                                Remercier
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px]"
                                onClick={() => handleReply('2', 'Marie Leroy')}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Ru00e9pondre
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="given" className="space-y-4">
                  <div className="space-y-4">
                    {/* u00c9valuations donnu00e9es */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-0.5">
                      <div className="relative p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">TB</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <div>
                                <h4 className="text-sm font-semibold">Thomas Bernard</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-muted-foreground">12 juin · Votre u00e9valuation</p>
                                  <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-300">
                                    Aller-retour
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3.5 w-3.5 ${star <= 5 ? "text-amber-400 fill-amber-400" : "text-muted"}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <p className="relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-primary/30">
                                &quot;Trajet parfait, Thomas est toujours tru00e8s professionnel et u00e0 l&apos;heure.&quot;
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground hover:text-foreground">
                                Modifier
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Dialog pour ru00e9pondre u00e0 une u00e9valuation */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ru00e9pondre u00e0 {selectedReview?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Votre message
              </label>
              <textarea
                id="message"
                className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Merci pour votre u00e9valuation..."
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
