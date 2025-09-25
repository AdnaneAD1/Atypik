'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Calendar, CreditCard, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionCreated: () => void;
}

export function SubscriptionModal({ isOpen, onClose, onSubscriptionCreated }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const { createSubscription, loading } = useSubscription();
  const { toast } = useToast();

  // Configuration PayPal
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "EUR",
    intent: "capture"
  };

  const handleSubscribe = (type: 'standard' | 'premium') => {
    const amount = type === 'standard' ? 149 : 189;
    setSelectedPlan(type);
    setPaymentAmount(amount);
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async (details: any) => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      await createSubscription(selectedPlan);
      toast({
        title: 'Paiement réussi !',
        description: selectedPlan === 'standard' 
          ? 'Votre abonnement standard est maintenant actif.' 
          : 'Votre abonnement premium est maintenant actif.',
      });
      onSubscriptionCreated();
      onClose();
      setShowPayPal(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'activation de l\'abonnement.',
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
      description: 'Le paiement n\'a pas pu être traité. Veuillez réessayer.',
      variant: 'destructive',
    });
    setShowPayPal(false);
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
      description: 'Jusqu\'à 2 rendez-vous par semaine',
      features: [
        'Jusqu\'à 2 transports/semaine',
        'Suivi en temps réel',
        'Support standard',
        'Annulation gratuite',
        'Messagerie avec chauffeurs'
      ],
      badge: 'Idéal pour débuter',
      badgeVariant: 'secondary' as const,
      icon: Calendar,
      popular: false
    },
    {
      id: 'premium' as const,
      title: 'Abonnement Premium',
      price: '189€',
      period: '/mois',
      description: 'Pour plus de 4 rendez-vous par semaine',
      features: [
        'Transports illimités',
        'Plus de 4 transports/semaine',
        'Suivi en temps réel',
        'Support prioritaire',
        'Annulation gratuite',
        'Messagerie avec chauffeurs'
      ],
      badge: 'Recommandé',
      badgeVariant: 'default' as const,
      icon: Crown,
      popular: true
    }
  ];

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {showPayPal ? 'Finaliser le paiement' : 'Choisissez votre formule'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {showPayPal 
                ? `Montant à payer : ${paymentAmount}€ pour ${selectedPlan === 'standard' ? 'l\'abonnement standard' : 'l\'abonnement premium'}`
                : 'Pour programmer un transport, vous devez souscrire à l\'une de nos formules'
              }
            </DialogDescription>
          </DialogHeader>

          {showPayPal ? (
            // Interface PayPal
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedPlan === 'standard' ? 'Abonnement Standard' : 'Abonnement Premium'}
                </h3>
                <p className="text-2xl font-bold text-primary mb-4">{paymentAmount}€</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan === 'standard' 
                    ? 'Abonnement mensuel Standard' 
                    : 'Abonnement mensuel Premium'}
                </p>
              </div>
              
              <div className="space-y-4">
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          value: paymentAmount.toString(),
                          currency_code: "EUR"
                        },
                        description: selectedPlan === 'standard' 
                          ? 'Abonnement Standard Atypik' 
                          : 'Abonnement Premium Atypik'
                      }]
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order!.capture().then((details) => {
                      handlePayPalSuccess(details);
                    });
                  }}
                  onError={handlePayPalError}
                  disabled={isProcessing}
                />
                
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
            // Sélection des plans
            <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            
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
                    <div className={`p-3 rounded-full ${
                      plan.popular ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-primary">{plan.price}</span>
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
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing || loading}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                    }`}
                  >
                    {isProcessing && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>S&apos;abonner</>
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
                    <p className="text-sm font-medium">Paiement sécurisé</p>
                    <p className="text-xs text-muted-foreground">
                      Vos informations de paiement sont protégées et chiffrées. 
                      Vous pouvez annuler votre abonnement à tout moment.
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
