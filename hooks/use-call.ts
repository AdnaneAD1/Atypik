'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { User as FirebaseUser } from 'firebase/auth';
import { useToast } from './use-toast';
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

// Type u00e9tendu pour l'utilisateur Firebase
type User = FirebaseUser & {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};

// Types pour les appels audio/vidéo
export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';

export type CallData = {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: CallType;
  status: CallStatus;
  startTime: any;
  endTime?: any;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates?: RTCIceCandidateInit[];
};

// Hook pour la gestion des appels audio/vidéo
export function useCall() {
  const { user: firebaseUser } = useAuth();
  const user = firebaseUser as User | null;
  const { toast } = useToast();
  
  // État pour les appels audio/vidéo
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  
  // Références pour WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const callDocRef = useRef<any>(null);

  // Initialiser un appel audio/vidéo
  const initializeCall = useCallback(async (
    conversationId: string,
    receiverId: string,
    receiverName: string,
    callType: CallType
  ) => {
    if (!user || !user.uid) return null;

    try {
      // Créer un ID unique pour l'appel
      const callId = `${conversationId}_${Date.now()}`;
      
      // Initialiser l'état de l'appel
      const callData: CallData = {
        id: callId,
        conversationId,
        callerId: user.uid,
        callerName: user.displayName || 'Vous',
        receiverId,
        receiverName,
        type: callType,
        status: 'ringing',
        startTime: serverTimestamp(),
        iceCandidates: []
      };
      
      // Enregistrer l'appel dans Firestore
      const callDoc = doc(db, 'calls', callId);
      await setDoc(callDoc, callData);
      callDocRef.current = callDoc;
      
      // Mettre à jour l'état local
      setCurrentCall(callData);
      setCallStatus('ringing');
      
      // Obtenir le flux média local
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Initialiser la connexion WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;
      
      // Ajouter les pistes au peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Écouter les pistes distantes
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      
      // Écouter les candidats ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Ajouter le candidat ICE à Firestore
          updateDoc(callDoc, {
            iceCandidates: arrayUnion(event.candidate.toJSON())
          });
        }
      };
      
      // Créer une offre
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Enregistrer l'offre dans Firestore
      await updateDoc(callDoc, {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
      
      // Écouter les changements dans l'appel
      const unsubscribe = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data() as CallData;
        
        if (data?.answer && pc.currentRemoteDescription === null) {
          // Appliquer la réponse
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
        
        // Mettre à jour l'état de l'appel
        if (data?.status) {
          setCallStatus(data.status);
          
          if (data.status === 'ended' || data.status === 'rejected') {
            endCall();
          }
        }
      });
      
      return callId;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'appel:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'initialiser l\'appel',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, toast]);

  // Répondre à un appel
  const answerCall = useCallback(async (callId: string) => {
    if (!user || !user.uid) return false;

    try {
      const callDoc = doc(db, 'calls', callId);
      const callSnapshot = await getDoc(callDoc);
      
      if (!callSnapshot.exists()) {
        throw new Error('Appel introuvable');
      }
      
      const callData = callSnapshot.data() as CallData;
      
      // Vérifier que l'utilisateur est bien le destinataire de l'appel
      if (callData.receiverId !== user.uid) {
        throw new Error('Vous n\'êtes pas le destinataire de cet appel');
      }
      
      // Mettre à jour l'état de l'appel
      await updateDoc(callDoc, {
        status: 'ongoing'
      });
      
      callDocRef.current = callDoc;
      setCurrentCall(callData);
      setCallStatus('ongoing');
      
      // Obtenir le flux média local
      const constraints = {
        audio: true,
        video: callData.type === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Initialiser la connexion WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;
      
      // Ajouter les pistes au peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Écouter les pistes distantes
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      
      // Écouter les candidats ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Ajouter le candidat ICE à Firestore
          updateDoc(callDoc, {
            iceCandidates: arrayUnion(event.candidate.toJSON())
          });
        }
      };
      
      // Appliquer l'offre
      if (callData.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        
        // Créer une réponse
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        // Enregistrer la réponse dans Firestore
        await updateDoc(callDoc, {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        });
      }
      
      // Appliquer les candidats ICE existants
      if (callData.iceCandidates) {
        for (const candidate of callData.iceCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      // Écouter les changements dans l'appel
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data() as CallData;
        
        // Mettre à jour l'état de l'appel
        if (data?.status) {
          setCallStatus(data.status);
          
          if (data.status === 'ended') {
            endCall();
          }
        }
        
        // Appliquer les nouveaux candidats ICE
        if (data?.iceCandidates && pc.remoteDescription) {
          const newCandidates = data.iceCandidates.filter(
            c => !callData.iceCandidates?.some(existing => 
              existing.candidate === c.candidate && 
              existing.sdpMid === c.sdpMid && 
              existing.sdpMLineIndex === c.sdpMLineIndex
            )
          );
          
          for (const candidate of newCandidates) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'appel:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de répondre à l\'appel',
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast]);

  // Rejeter un appel
  const rejectCall = useCallback(async (callId: string) => {
    if (!user || !user.uid) return false;

    try {
      const callDoc = doc(db, 'calls', callId);
      await updateDoc(callDoc, {
        status: 'rejected',
        endTime: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors du rejet de l\'appel:', error);
      return false;
    }
  }, [user]);

  // Terminer un appel
  const endCall = useCallback(async () => {
    if (!user || !currentCall) return;

    try {
      // Mettre à jour l'état de l'appel dans Firestore
      if (callDocRef.current) {
        await updateDoc(callDocRef.current, {
          status: 'ended',
          endTime: serverTimestamp()
        });
      }
      
      // Nettoyer les ressources WebRTC
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Arrêter les flux média
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
      
      // Réinitialiser l'état
      setCurrentCall(null);
      setCallStatus(null);
      callDocRef.current = null;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la fin de l\'appel:', error);
      return false;
    }
  }, [user, currentCall, localStream, remoteStream]);

  return {
    currentCall,
    callStatus,
    localStream,
    remoteStream,
    initializeCall,
    answerCall,
    rejectCall,
    endCall
  };
}
