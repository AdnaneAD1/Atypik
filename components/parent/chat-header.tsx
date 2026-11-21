"use client";

import { User, CarFront, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
  avatarUrl?: string;
  name: string;
  role?: string;
  online?: boolean;
  onBack?: () => void;
  onCallVoice?: () => void;
  onCallVideo?: () => void;
}

export function ChatHeader({
  avatarUrl,
  name,
  role,
  online,
  onBack
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary md:hidden"
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {role === 'Chauffeur' ? <CarFront className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        {online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground">
          {online ? (
            <span className="text-emerald-600 dark:text-emerald-400">En ligne</span>
          ) : (
            role
          )}
        </div>
      </div>
    </div>
  );
}
