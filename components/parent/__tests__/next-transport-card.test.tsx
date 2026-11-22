import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextTransportCard } from '../next-transport-card';
import type { ChildProfile, UpcomingTrip } from '@/hooks/use-dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const trip: UpcomingTrip = {
  id: 't1',
  childName: 'Marc Aurel',
  driverName: 'Thomas Martin',
  from: { address: '12 rue de la Paix', lat: 0, lng: 0 },
  to: { address: 'CHU centre ville', lat: 0, lng: 0 },
  scheduledTime: new Date(2026, 10, 21, 8, 30),
  status: 'programmed',
  transportType: 'aller',
  distance: 4.2,
};

const child: ChildProfile = {
  id: 'c1',
  name: 'Marc Aurel',
  age: 9,
  school: 'CHU centre ville',
  grade: 'CM1',
  totalTrips: 12,
};

describe('NextTransportCard', () => {
  it('affiche le prochain transport avec l’enfant et l’horaire', () => {
    render(<NextTransportCard trip={trip} child={child} />);
    expect(screen.getByText('Prochain transport')).toBeInTheDocument();
    expect(screen.getByText('Marc Aurel')).toBeInTheDocument();
    expect(screen.getByText(/Thomas Martin/)).toBeInTheDocument();
    expect(screen.getByText(/Aller/)).toBeInTheDocument();
  });

  it('affiche toujours le libellé Prochain transport (le trajet actif vit dans le bandeau)', () => {
    render(<NextTransportCard trip={{ ...trip, status: 'in-progress' }} child={child} />);
    expect(screen.getByText('Prochain transport')).toBeInTheDocument();
    expect(screen.queryByText('En cours')).not.toBeInTheDocument();
  });

  it('garde la carte visible sans transport programmé', () => {
    render(<NextTransportCard trip={null} child={null} />);
    expect(screen.getByText('Aucun transport programmé')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Programmer un transport/ })).toBeInTheDocument();
  });
});
