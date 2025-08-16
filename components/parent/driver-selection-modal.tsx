'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Phone, Clock, Check, Car, Users, Award, TrendingUp, Shield, Zap } from 'lucide-react';
import { useDriverSelection, Driver } from '@/hooks/use-driver-selection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DriverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverSelected: (driver: Driver) => void;
}

export const DriverSelectionModal = ({
  isOpen,
  onClose,
  onDriverSelected,
}: DriverSelectionModalProps) => {
  const { drivers, selectedDriver, selectDriver, loading, error } = useDriverSelection();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectDriver = async (driver: Driver) => {
    setIsSelecting(true);
    
    try {
      const success = await selectDriver(driver);
      if (success) {
        onDriverSelected(driver);
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du chauffeur:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const getDriverInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[80vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Choisir un chauffeur
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sélectionnez un chauffeur de votre région pour programmer un transport
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Chargement des chauffeurs...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              )}

              {!loading && !error && drivers.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun chauffeur disponible
                  </h3>
                  <p className="text-gray-600">
                    Aucun chauffeur n'est actuellement disponible dans votre région.
                  </p>
                </div>
              )}

              {!loading && !error && drivers.length > 0 && (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {drivers.map((driver) => (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      className={`
                        relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300
                        ${selectedDriver?.id === driver.id
                          ? 'ring-4 ring-blue-500 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100'
                          : 'shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
                        }
                      `}
                      onClick={() => handleSelectDriver(driver)}
                    >
                      {/* Header avec avatar et sélection */}
                      <div className="relative p-6 pb-4">
                        {/* Badge de sélection */}
                        {selectedDriver?.id === driver.id && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Avatar et informations principales */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                              <AvatarImage src={driver.avatar} alt={driver.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                {getDriverInitials(driver.name)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Badge d'expérience */}
                            {driver.stats?.experienceYears && (
                              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {driver.stats.experienceYears}Y
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {driver.name}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant={driver.status === 'verified' ? 'outline' : 'secondary'}
                                className={`text-xs ${
                                  driver.status === 'verified' 
                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                    : ''
                                }`}
                              >
                                {driver.status === 'verified' ? 'Vérifié' : 'Non vérifié'}
                              </Badge>
                              {driver.stats?.averageRating && driver.stats.averageRating > 4.5 && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
                                  <Award className="h-3 w-3 mr-1" />
                                  Expert
                                </Badge>
                              )}
                            </div>
                            
                            {/* Note globale */}
                            {driver.stats?.averageRating && driver.stats.averageRating > 0 && (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-lg font-bold text-gray-900">
                                    {driver.stats.averageRating.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({driver.stats.totalReviews} avis)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Statistiques FIFA-style */}
                      {driver.stats && (
                        <div className="px-6 pb-6">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Missions totales */}
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <Car className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                              <div className="text-2xl font-bold text-gray-900">
                                {driver.stats.totalMissions}
                              </div>
                              <div className="text-xs text-gray-600">Missions</div>
                            </div>
                            
                            {/* Enfants transportés */}
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                              <div className="text-2xl font-bold text-gray-900">
                                {driver.stats.uniqueChildrenTransported}
                              </div>
                              <div className="text-xs text-gray-600">Enfants</div>
                            </div>
                            
                            {/* Distance parcourue */}
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <MapPin className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                              <div className="text-2xl font-bold text-gray-900">
                                {Math.round(driver.stats.totalKmTraveled)}
                              </div>
                              <div className="text-xs text-gray-600">km</div>
                            </div>
                            
                            {/* Missions ce mois */}
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                              <div className="text-2xl font-bold text-gray-900">
                                {driver.stats.thisMonthMissions}
                              </div>
                              <div className="text-xs text-gray-600">Ce mois</div>
                            </div>
                          </div>
                          
                          {/* Barres de progression pour les scores */}
                          <div className="space-y-3">
                            {/* Ponctualité */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Ponctualité</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {Math.round(driver.stats.punctualityRate)}%
                                </span>
                              </div>
                              <Progress 
                                value={driver.stats.punctualityRate} 
                                className="h-2"
                              />
                            </div>
                            
                            {/* Fiabilité */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">Fiabilité</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {Math.round(driver.stats.reliabilityScore)}/100
                                </span>
                              </div>
                              <Progress 
                                value={driver.stats.reliabilityScore} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Footer avec contact */}
                      {driver.phone && (
                        <div className="px-6 py-3 bg-gray-50/80 border-t">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{driver.phone}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && !error && drivers.length > 0 && (
              <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">
                  {selectedDriver 
                    ? `${selectedDriver.name} sélectionné` 
                    : 'Sélectionnez un chauffeur pour continuer'
                  }
                </p>
                
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    disabled={!selectedDriver || isSelecting}
                    onClick={() => selectedDriver && handleSelectDriver(selectedDriver)}
                  >
                    {isSelecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sélection...
                      </>
                    ) : (
                      'Confirmer'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
