'use client';

import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 cursor-pointer",
        notification.read ? "opacity-80" : "bg-secondary/30"
      )}
      onClick={onMarkAsRead}
    >
      <div className="flex justify-between items-start">
        <h4 className={cn(
          "text-sm font-medium",
          !notification.read && "font-semibold"
        )}>
          {notification.title}
        </h4>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-muted-foreground">{notification.time}</span>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary"></span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
      
      {!notification.read && (
        <div className="mt-2 flex justify-end">
          <button className="text-xs text-primary flex items-center" onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}>
            <CheckCheck className="h-3 w-3 mr-1" />
            Marquer comme lu
          </button>
        </div>
      )}
    </motion.div>
  );
}