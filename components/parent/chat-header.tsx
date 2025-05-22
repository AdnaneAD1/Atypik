"use client";

import { Phone, Video, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
  avatarUrl?: string;
  name: string;
  role?: string;
  onCallVoice?: () => void;
  onCallVideo?: () => void;
}

export function ChatHeader({
  avatarUrl,
  name,
  role,
  onCallVoice,
  onCallVideo
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-base leading-tight">{name}</span>
          {role && <span className="text-xs text-muted-foreground leading-none">{role}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCallVoice}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Appel vocal"
        >
          <Phone className="h-5 w-5 text-primary" />
        </button>
        <button
          onClick={onCallVideo}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Appel vidéo"
        >
          <Video className="h-5 w-5 text-primary" />
        </button>
      </div>
    </div>
  );
}
