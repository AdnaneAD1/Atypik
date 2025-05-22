'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    title: 'Nouvelle mission',
    message: 'Vous avez une nouvelle mission pour demain à 8h30',
    time: '2h',
    read: false,
  },
  {
    id: '2',
    title: 'Message de Lucie',
    message: 'Bonjour, est-ce que vous pouvez passer prendre Emma à 16h15 ?',
    time: '3h',
    read: false,
  },
  {
    id: '3',
    title: 'Rappel transport',
    message: 'N\'oubliez pas le transport de Thomas demain matin',
    time: '5h',
    read: true,
  },
  {
    id: '4',
    title: 'Nouvelle formation disponible',
    message: 'Découvrez notre nouvelle formation sur la gestion des enfants TDAH',
    time: '1j',
    read: true,
  },
  {
    id: '5',
    title: 'Modification d\'horaire',
    message: 'Le transport de vendredi a été déplacé à 15h au lieu de 16h30',
    time: '2j',
    read: true,
  },
];

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8">
              Tout marquer comme lu
            </Button>
          )}
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Aucune notification
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}