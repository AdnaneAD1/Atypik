import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function DriverPending() {
  const { logout } = useAuth();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-primary">Compte en attente de validation</h2>
        <p className="text-muted-foreground mb-6">
          Merci pour votre inscription en tant que chauffeur.<br />
          Votre compte est en cours d'examen par notre équipe. Vous serez contacté par email ou téléphone dès que votre profil aura été validé.
        </p>
        <Button variant="outline" onClick={logout} className="flex items-center gap-2 mx-auto">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
