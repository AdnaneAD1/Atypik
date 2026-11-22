import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriverProfileDialog } from '../driver-profile-dialog';
import type { Driver } from '@/hooks/use-driver-selection';

const driver: Driver = {
  id: 'd1',
  name: 'Thomas Martin',
  email: 'thomas@example.com',
  status: 'verified',
  regionId: 'r1',
  phone: '0601020304',
  stats: {
    totalMissions: 45,
    completedMissions: 40,
    averageRating: 4,
    totalReviews: 3,
    thisMonthMissions: 2,
    totalKmTraveled: 27761,
    uniqueChildrenTransported: 7,
    punctualityRate: 52,
    reliabilityScore: 85,
    experienceYears: 1,
  },
};

const newDriver: Driver = {
  ...driver,
  id: 'd2',
  name: 'Sebastien Doe',
  stats: {
    totalMissions: 0,
    completedMissions: 0,
    averageRating: 0,
    totalReviews: 0,
    thisMonthMissions: 0,
    totalKmTraveled: 0,
    uniqueChildrenTransported: 0,
    punctualityRate: 0,
    reliabilityScore: 0,
    experienceYears: 1,
  },
};

describe('DriverProfileDialog', () => {
  it('affiche le profil détaillé du chauffeur en lecture seule', () => {
    render(<DriverProfileDialog driver={driver} open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Thomas Martin')).toBeInTheDocument();
    expect(screen.getByText('Chauffeur vérifié')).toBeInTheDocument();
    expect(screen.getByText('Missions')).toBeInTheDocument();
    expect(screen.getByText('Ponctualité')).toBeInTheDocument();
    expect(screen.getByText('Fiabilité')).toBeInTheDocument();
    expect(screen.getByText('0601020304')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('masque les compteurs à zéro pour un nouveau chauffeur', () => {
    render(<DriverProfileDialog driver={newDriver} open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/contrôlé et validé par nos équipes/)).toBeInTheDocument();
    expect(screen.queryByText(/Pas encore d.avis/)).not.toBeInTheDocument();
    expect(screen.queryByText('Ponctualité')).not.toBeInTheDocument();
    expect(screen.queryByText('Missions')).not.toBeInTheDocument();
  });

  it('n’affiche rien sans chauffeur', () => {
    const { container } = render(
      <DriverProfileDialog driver={null} open onOpenChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
