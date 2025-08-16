'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, BellOff, Smartphone, MessageSquare, Car, Info } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const [isEnabling, setIsEnabling] = useState(false);
  const { 
    settings, 
    loading, 
    error, 
    isSupported, 
    hasPermission,
    enableNotifications, 
    disableNotifications, 
    updatePermissions 
  } = useNotifications();
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const success = await enableNotifications();
      if (success) {
        toast({
          title: 'Notifications activées !',
          description: 'Vous recevrez maintenant les notifications push.',
        });
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
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await disableNotifications();
      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la désactivation des notifications.',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionChange = async (permission: string, enabled: boolean) => {
    try {
      await updatePermissions({ [permission]: enabled });
      toast({
        title: 'Paramètres mis à jour',
        description: `Notifications ${permission} ${enabled ? 'activées' : 'désactivées'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les paramètres.',
        variant: 'destructive',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications non supportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Navigateur non compatible</p>
              <p className="text-xs text-muted-foreground mt-1">
                Votre navigateur ne supporte pas les notifications push. 
                Utilisez Chrome, Firefox, Safari ou Edge pour recevoir des notifications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Push
          {settings?.isEnabled && (
            <Badge variant="default" className="ml-2">Activées</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation/Désactivation principale */}
        <div className="space-y-4">
          {!settings?.isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Activez les notifications push
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Recevez des alertes en temps réel pour vos transports, messages et mises à jour importantes.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleEnableNotifications}
                disabled={isEnabling || loading}
                className="w-full"
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activation en cours...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Activer les notifications
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications activées</p>
                  <p className="text-sm text-muted-foreground">
                    Vous recevez les notifications push
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisableNotifications}
                  disabled={loading}
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Désactiver
                </Button>
              </div>

              {/* Paramètres détaillés */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Types de notifications</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Transports</p>
                        <p className="text-xs text-muted-foreground">
                          Confirmations, modifications, arrivées
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.permissions.transport}
                      onCheckedChange={(checked) => handlePermissionChange('transport', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Messages</p>
                        <p className="text-xs text-muted-foreground">
                          Nouveaux messages des chauffeurs
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.permissions.messages}
                      onCheckedChange={(checked) => handlePermissionChange('messages', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Informations générales</p>
                        <p className="text-xs text-muted-foreground">
                          Mises à jour de l'application
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.permissions.general}
                      onCheckedChange={(checked) => handlePermissionChange('general', checked)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statut et informations */}
        {settings && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-muted-foreground">Statut</p>
                <p className={settings.isEnabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.isEnabled ? 'Actives' : 'Désactivées'}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Permission navigateur</p>
                <p className={hasPermission ? 'text-green-600' : 'text-red-600'}>
                  {hasPermission ? 'Accordée' : 'Refusée'}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
