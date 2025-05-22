'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Star, MessageSquare, ThumbsUp } from 'lucide-react';

export function DriverReviews() {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;
  
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
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };
  
  // Données des avis
  const allReviews = [
    {
      id: 'R001',
      date: '15 mai 2025',
      parent: {
        name: 'Marie Dubois',
        avatar: null,
        relation: 'Mère de Lucas'
      },
      rating: 5,
      comment: 'Excellent service ! Le chauffeur est toujours à l\'heure et très attentionné avec mon fils qui a des besoins spécifiques. Je recommande vivement.',
      child: 'Lucas Dubois',
      mission: 'Transport école - 15 mai 2025'
    },
    {
      id: 'R002',
      date: '14 mai 2025',
      parent: {
        name: 'Sophie Martin',
        avatar: null,
        relation: 'Mère d\'Emma'
      },
      rating: 5,
      comment: 'Très satisfaite du service. Le chauffeur est professionnel et rassurant. Ma fille est toujours contente de le retrouver pour ses trajets.',
      child: 'Emma Martin',
      mission: 'Transport école - 14 mai 2025'
    },
    {
      id: 'R003',
      date: '13 mai 2025',
      parent: {
        name: 'Thomas Petit',
        avatar: null,
        relation: 'Père de Léo'
      },
      rating: 4,
      comment: 'Bon service dans l\'ensemble. Le chauffeur est ponctuel et sympathique. Quelques petits retards parfois mais rien de grave.',
      child: 'Léo Petit',
      mission: 'Transport centre de rééducation - 13 mai 2025'
    },
    {
      id: 'R004',
      date: '12 mai 2025',
      parent: {
        name: 'Julie Moreau',
        avatar: null,
        relation: 'Mère de Chloé'
      },
      rating: 5,
      comment: 'Service impeccable ! Le chauffeur est très professionnel et a su s\'adapter aux besoins spécifiques de ma fille. Je suis pleinement satisfaite.',
      child: 'Chloé Moreau',
      mission: 'Transport école - 12 mai 2025'
    },
    {
      id: 'R005',
      date: '11 mai 2025',
      parent: {
        name: 'Pierre Durand',
        avatar: null,
        relation: 'Père de Nathan'
      },
      rating: 4,
      comment: 'Très bon service. Le chauffeur est ponctuel et prend bien soin de mon fils. Je recommande.',
      child: 'Nathan Durand',
      mission: 'Transport école - 11 mai 2025'
    }
  ];
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(allReviews.length / reviewsPerPage);
  
  // Obtenir les avis pour la page actuelle
  const currentReviews = allReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );
  
  // Fonction pour changer de page
  const changePage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Fonction pour rendre les étoiles
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* En-tête */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Avis des parents</h1>
          <p className="text-muted-foreground">Ce que les parents pensent de vos services</p>
        </div>
        <Badge className="text-lg px-3 py-1.5 bg-primary/10 text-primary border-0 flex items-center gap-1">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          4.9/5
        </Badge>
      </motion.div>
      
      {/* Liste des avis */}
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <Card key={review.id} className="shadow-md border border-gray-100 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-1 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {review.parent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.parent.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{review.parent.relation}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{review.date}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                    {review.child}
                  </Badge>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {review.comment}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{review.mission}</p>
                    <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-primary hover:bg-primary/5">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Remercier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => changePage(page)}
                    className={page === currentPage ? "bg-primary" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
