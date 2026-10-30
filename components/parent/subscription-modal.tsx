'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Calendar, RefreshCw, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionCreated: () => void;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubscriptionCreated,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const { subscription, createSubscription, loading } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();

  // Identifiants de plans récurrents PayPal (si configurés dans .env.local)
  const standardPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_STANDARD;
  const premiumPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PREMIUM;
  const activePlanId =
    selectedPlan === 'standard' ? standardPlanId : premiumPlanId;
  const useNativePayPalSubscription = Boolean(activePlanId);

  // Configuration PayPal dynamique (Subscription récurrente si Plan ID défini, sinon Capture directe)
  const paypalOptions = useNativePayPalSubscription
    ? {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
        currency: 'EUR',
        intent: 'subscription',
        vault: true,
      }
    : {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
        currency: 'EUR',
        intent: 'capture',
      };

  const handleSubscribe = (type: 'standard' | 'premium') => {
    const amount = type === 'standard' ? 149 : 189;
    setSelectedPlan(type);
    setPaymentAmount(amount);
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async (details: {
    paypalOrderId?: string;
    paypalSubscriptionId?: string;
    payerEmail?: string;
  }) => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      await createSubscription(selectedPlan, {
        ...details,
        autoRenew: true,
      });
      toast({
        title: 'Abonnement activé !',
        description:
          selectedPlan === 'standard'
            ? 'Votre abonnement Standard (avec renouvellement automatique mensuel) est maintenant actif.'
            : 'Votre abonnement Premium (avec renouvellement automatique mensuel) est maintenant actif.',
      });
      onSubscriptionCreated();
      onClose();
      setShowPayPal(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          "Une erreur est survenue lors de l'activation de l'abonnement.",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('Erreur PayPal:', error);
    toast({
      title: 'Erreur de paiement',
      description:
        "Le paiement n'a pas pu être traité. Veuillez vérifier vos informations et réessayer.",
      variant: 'destructive',
    });
  };

  const handleBackToPlans = () => {
    setShowPayPal(false);
    setSelectedPlan(null);
  };

  const plans = [
    {
      id: 'standard' as const,
      title: 'Abonnement Standard',
      price: '149€',
      period: '/mois',
      description: "Jusqu'à 2 rendez-vous par semaine",
      features: [
        "Jusqu'à 2 transports/semaine",
        'Renouvellement automatique mensuel',
        'Suivi en temps réel',
        'Support standard',
        'Annulation gratuite à tout moment',
        'Messagerie avec chauffeurs',
      ],
      badge: 'Idéal pour débuter',
      badgeVariant: 'secondary' as const,
      icon: Calendar,
      popular: false,
    },
    {
      id: 'premium' as const,
      title: 'Abonnement Premium',
      price: '189€',
      period: '/mois',
      description: 'Transports illimités chaque semaine',
      features: [
        'Transports illimités',
        'Plus de 4 transports/semaine',
        'Renouvellement automatique mensuel',
        'Suivi en temps réel',
        'Support prioritaire',
        'Annulation gratuite à tout moment',
        'Messagerie avec chauffeurs',
      ],
      badge: 'Recommandé',
      badgeVariant: 'default' as const,
      icon: Crown,
      popular: true,
    },
  ];

  return (
    <PayPalScriptProvider
      key={useNativePayPalSubscription ? 'sub-mode' : 'capture-mode'}
      options={paypalOptions}
    >
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {showPayPal ? 'Finaliser votre abonnement' : 'Choisissez votre formule'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {showPayPal
                ? `${paymentAmount}€/mois — ${
                    selectedPlan === 'standard'
                      ? 'Formule Standard'
                      : 'Formule Premium'
                  } (renouvellement automatique mensuel)`
                : "Pour programmer un transport, souscrivez à l'une de nos formules mensuelles sans engagement"}
            </DialogDescription>
          </DialogHeader>

          {showPayPal ? (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedPlan === 'standard'
                    ? 'Abonnement Standard'
                    : 'Abonnement Premium'}
                </h3>
                <p className="text-2xl font-bold text-primary mb-2">
                  {paymentAmount}€ <span className="text-sm font-normal text-muted-foreground">/ mois</span>
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  <span>Renouvellement automatique mensuel • Résiliable en 1 clic</span>
                </div>
              </div>

              <div className="space-y-4">
                {useNativePayPalSubscription && activePlanId ? (
                  <PayPalButtons
                    style={{ layout: 'vertical', label: 'subscribe' }}
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id: activePlanId,
                        custom_id: user?.id || undefined,
                      });
                    }}
                    onApprove={async (data) => {
                      await handlePayPalSuccess({
                        paypalSubscriptionId: data.subscriptionID || undefined,
                        paypalOrderId: data.orderID || undefined,
                      });
                    }}
                    onError={handlePayPalError}
                    disabled={isProcessing}
                  />
                ) : (
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [
                          {
                            custom_id: user?.id || undefined,
                            amount: {
                              value: paymentAmount.toString(),
                              currency_code: 'EUR',
                            },
                            description:
                              selectedPlan === 'standard'
                                ? 'Abonnement Mensuel Standard Atypik'
                                : 'Abonnement Mensuel Premium Atypik',
                          },
                        ],
                      });
                    }}
                    onApprove={(data, actions) => {
                      return actions.order!.capture().then((details) => {
                        handlePayPalSuccess({
                          paypalOrderId: details?.id || data.orderID,
                          payerEmail: details?.payer?.email_address,
                        });
                      });
                    }}
                    onError={handlePayPalError}
                    disabled={isProcessing}
                  />
                )}

                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={handleBackToPlans}
                    disabled={isProcessing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Retour aux formules
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.id;
                const isCurrentActivePlan =
                  subscription?.status === 'active' && subscription?.type === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    } ${plan.popular ? 'border-primary/20' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" className="px-3 py-1">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-3">
                        <div
                          className={`p-3 rounded-full ${
                            plan.popular ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              plan.popular ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        </div>
                      </div>

                      <CardTitle className="text-xl">{plan.title}</CardTitle>

                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-primary">
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.description}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscribe(plan.id);
                        }}
                        disabled={isProcessing || loading || isCurrentActivePlan}
                        className={`w-full ${
                          plan.popular
                            ? 'bg-primary hover:bg-primary/90'
                            : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                        }`}
                      >
                        {isCurrentActivePlan ? (
                          'Formule actuelle'
                        ) : isProcessing && selectedPlan === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : subscription?.status === 'active' &&
                          subscription?.type === 'standard' &&
                          plan.id === 'premium' ? (
                          'Passer en Premium'
                        ) : (
                          "S'abonner"
                        )}
                      </Button>
                    </CardContent>

                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {!showPayPal && (
            <>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Paiement sécurisé & renouvellement automatique
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Votre abonnement est renouvelé automatiquement chaque mois.
                      Vous pouvez désactiver le renouvellement automatique à tout moment
                      depuis votre planning tout en conservant vos droits jusqu&apos;à la fin du mois payé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PayPalScriptProvider>
  );
}
