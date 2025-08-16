'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, Smartphone } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { 
    settings, 
    loading, 
    isSupported, 
    hasPermission,
    enableNotifications 
  } = useNotifications();
  const { toast } = useToast();

  // Vérifier si on doit afficher le prompt
  useEffect(() => {
    // Ne pas afficher si :
    // - Les notifications ne sont pas supportées
    // - L'utilisateur a déjà des paramètres (activées ou refusées)
    // - Le prompt a été fermé dans cette session
    // - Les permissions sont déjà accordées
    if (!isSupported || settings || isDismissed || hasPermission) {
      setShowPrompt(false);
      return;
    }

    // Afficher le prompt après un délai pour ne pas être intrusif
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000); // 3 secondes après le chargement

    return () => clearTimeout(timer);
  }, [isSupported, settings, isDismissed, hasPermission]);

  const handleEnableNotifications = async () => {
    try {
      const success = await enableNotifications();
      if (success) {
        toast({
          title: 'Notifications activées !',
          description: 'Vous recevrez maintenant les notifications importantes.',
        });
        setShowPrompt(false);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer les notifications. Vérifiez vos paramètres de navigateur.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'activation des notifications.',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    
    // Stocker le refus dans le localStorage pour cette session
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Vérifier le localStorage au montage
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="border shadow-lg bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">
                    Activez les notifications
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recevez des alertes en temps réel pour vos transports et messages importants.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleEnableNotifications}
                    disabled={loading}
                    className="flex-1 h-8 text-xs"
                  >
                    <Smartphone className="h-3 w-3 mr-1" />
                    Activer
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
