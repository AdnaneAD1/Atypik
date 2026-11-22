import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriverSubscriptionPanel } from '../driver-subscription-panel';

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/hooks/use-driver-selection', () => ({
  useDriverSelection: vi.fn(),
}));
vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: vi.fn(),
}));
vi.mock('@/components/parent/driver-selection-modal', () => ({
  DriverSelectionModal: () => null,
}));
vi.mock('@/components/parent/driver-profile-dialog', () => ({
  DriverProfileDialog: () => null,
}));
vi.mock('@/components/parent/subscription-modal', () => ({
  SubscriptionModal: () => null,
}));

import { useAuth } from '@/lib/auth/auth-context';
import { useDriverSelection } from '@/hooks/use-driver-selection';
import { useSubscription } from '@/hooks/use-subscription';

const driver = {
  id: 'd1',
  name: 'Thomas Martin',
  status: 'verified',
  stats: { averageRating: 4, totalReviews: 3 },
};

const subscription = {
  type: 'premium',
  price: 29,
  autoRenew: true,
  nextBillingDate: { toDate: () => new Date(2030, 2, 15) },
};

const mockHooks = ({
  role = 'parent',
  drv = driver,
  sub = subscription,
  active = true,
}: {
  role?: string;
  drv?: typeof driver | null;
  sub?: typeof subscription | null;
  active?: boolean;
} = {}) => {
  (useAuth as any).mockReturnValue({ user: { role } });
  (useDriverSelection as any).mockReturnValue({ selectedDriver: drv, loading: false });
  (useSubscription as any).mockReturnValue({
    subscription: sub,
    hasActiveSubscription: active,
    cancelSubscription: vi.fn(),
    loadSubscription: vi.fn(),
    loading: false,
  });
};

describe('DriverSubscriptionPanel', () => {
  it('affiche le chauffeur et la formule active', () => {
    mockHooks();
    render(<DriverSubscriptionPanel />);
    expect(screen.getByText('Votre chauffeur')).toBeInTheDocument();
    expect(screen.getByText('Thomas Martin')).toBeInTheDocument();
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
    expect(screen.getByText('Mon abonnement')).toBeInTheDocument();
    expect(screen.getByText('Transports illimités')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Arrêter l’abonnement/ })).toBeInTheDocument();
  });

  it('affiche les états vides sans chauffeur ni abonnement', () => {
    mockHooks({ drv: null, sub: null, active: false });
    render(<DriverSubscriptionPanel />);
    expect(screen.getByText('Attribution en cours')).toBeInTheDocument();
    expect(screen.getByText(/assigneront un chauffeur de notre réseau/)).toBeInTheDocument();
    expect(screen.getByText('Aucune formule active')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Choisir un chauffeur/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choisir une formule/ })).toBeInTheDocument();
  });

  it('n’affiche rien pour un rôle autre que parent', () => {
    mockHooks({ role: 'driver' });
    const { container } = render(<DriverSubscriptionPanel />);
    expect(container).toBeEmptyDOMElement();
  });
});
