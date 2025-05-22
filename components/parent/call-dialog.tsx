'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallData, CallStatus } from '@/hooks/use-call';
import { User, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface CallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: CallStatus | null;
  onAnswer: () => void;
  onReject: () => void;
  onEnd: () => void;
  isCurrentUserCaller: boolean;
}

export function CallDialog({
  open,
  onOpenChange,
  call,
  localStream,
  remoteStream,
  callStatus,
  onAnswer,
  onReject,
  onEnd,
  isCurrentUserCaller
}: CallDialogProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Connecter les flux vidéo aux éléments HTML
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
  // Gérer la fermeture du dialogue
  const handleClose = () => {
    if (callStatus === 'ringing') {
      onReject();
    } else if (callStatus === 'ongoing') {
      onEnd();
    }
    onOpenChange(false);
  };
  
  // Activer/désactiver le micro
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Activer/désactiver la vidéo
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Obtenir le nom de l'autre participant
  const getOtherParticipantName = () => {
    if (!call) return '';
    return isCurrentUserCaller ? call.receiverName : call.callerName;
  };
  
  // Obtenir le type d'appel (audio/vidéo)
  const isVideoCall = call?.type === 'video';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="relative h-[500px] bg-black flex flex-col">
          {/* Vidéo distante (plein écran) */}
          {isVideoCall && remoteStream && callStatus === 'ongoing' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-primary/20 to-primary/40 flex items-center justify-center z-0">
              <Avatar className="h-32 w-32">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Vidéo locale (petite fenêtre) */}
          {isVideoCall && localStream && (
            <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-background z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Informations d'appel */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent text-white z-10">
            <h3 className="text-xl font-semibold">{getOtherParticipantName()}</h3>
            <p className="text-sm opacity-80">
              {callStatus === 'ringing' && !isCurrentUserCaller && 'Appel entrant...'}
              {callStatus === 'ringing' && isCurrentUserCaller && 'Appel en cours...'}
              {callStatus === 'ongoing' && 'En communication'}
              {callStatus === 'ended' && 'Appel terminé'}
              {callStatus === 'rejected' && 'Appel rejeté'}
              {callStatus === 'missed' && 'Appel manqué'}
            </p>
          </div>
          
          {/* Contrôles d'appel */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent flex justify-center gap-4 z-10">
            {callStatus === 'ringing' && !isCurrentUserCaller ? (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={onReject}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={onAnswer}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : callStatus === 'ongoing' ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-12 w-12 rounded-full ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white'}`}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                {isVideoCall && (
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-12 w-12 rounded-full ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white'}`}
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={onEnd}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
