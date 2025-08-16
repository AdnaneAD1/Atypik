'use client';

import { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationsPopover() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  // Utilitaire pour formater un temps relatif simple à partir d'une date
  const formatRelative = (date?: Date): string => {
    if (!date) return '';
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}j`;
  };

  // Adapter la structure attendue par NotificationItem (ajout du champ time)
  const displayNotifications = useMemo(() => {
    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      time: formatRelative(n.createdAt ? n.createdAt.toDate() : undefined),
    }));
  }, [notifications]);

  // Séparer non lues et lues
  const { unreadList, readList } = useMemo(() => {
    const unread = displayNotifications.filter(n => !n.read);
    const read = displayNotifications.filter(n => n.read);
    return { unreadList: unread, readList: read };
  }, [displayNotifications]);

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
        {displayNotifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {/* Non lues */}
              {unreadList.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-foreground/80 bg-muted/30">
                  Non lues
                </div>
              )}
              {unreadList.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}

              {/* Lues */}
              {readList.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground/80">
                  Lues
                </div>
              )}
              {readList.map((notification) => (
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