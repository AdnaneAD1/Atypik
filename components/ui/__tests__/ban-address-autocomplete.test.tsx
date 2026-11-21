import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BanAddressAutocomplete, type BanAddressResult } from '../ban-address-autocomplete';

const banResponse = {
  features: [
    {
      properties: { label: '10 Rue de la Paix 75002 Paris', city: 'Paris', postcode: '75002' },
      geometry: { coordinates: [2.331, 48.869] },
    },
    {
      properties: { label: '12 Rue de la Paix 56000 Vannes', city: 'Vannes', postcode: '56000' },
      geometry: { coordinates: [-2.76, 47.65] },
    },
  ],
};

const fetchMock = vi.fn();

function Wrapper({
  onChange,
  onSelect,
}: {
  onChange: (v: string) => void;
  onSelect?: (r: BanAddressResult) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <BanAddressAutocomplete
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      onSelect={onSelect}
      placeholder="Votre adresse"
    />
  );
}

describe('BanAddressAutocomplete', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  function setup() {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<Wrapper onChange={onChange} onSelect={onSelect} />);
    return { onChange, onSelect, input: screen.getByRole('combobox') };
  }

  it('affiche le champ de saisie', () => {
    const { input } = setup();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Votre adresse');
  });

  it('ne lance pas de requête avant 3 caractères', async () => {
    const { input } = setup();
    await userEvent.type(input, '12');
    await new Promise((r) => setTimeout(r, 300));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('interroge l’API de géocodage BAN avec la saisie', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => banResponse });
    const { input } = setup();
    await userEvent.type(input, '10 rue de la paix');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://data.geopf.fr/geocodage/search');
    expect(url).toContain('autocomplete=1');
    expect(url).toContain('limit=5');
  });

  it('affiche les suggestions renvoyées par l’API', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => banResponse });
    const { input } = setup();
    await userEvent.type(input, '10 rue de la paix');

    expect(await screen.findByText('10 Rue de la Paix 75002 Paris')).toBeInTheDocument();
    expect(screen.getByText('12 Rue de la Paix 56000 Vannes')).toBeInTheDocument();
  });

  it('remplit le champ et notifie onSelect avec les coordonnées au clic', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => banResponse });
    const { input, onSelect } = setup();
    await userEvent.type(input, '10 rue de la paix');

    await userEvent.click(await screen.findByText('10 Rue de la Paix 75002 Paris'));

    expect(input).toHaveValue('10 Rue de la Paix 75002 Paris');
    expect(onSelect).toHaveBeenCalledWith({
      address: '10 Rue de la Paix 75002 Paris',
      city: 'Paris',
      postcode: '75002',
      lat: 48.869,
      lng: 2.331,
    });
  });

  it('sélectionne une suggestion au clavier (flèches + Entrée)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => banResponse });
    const { input, onSelect } = setup();
    await userEvent.type(input, '10 rue de la paix');

    await screen.findByText('10 Rue de la Paix 75002 Paris');
    await userEvent.type(input, '{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ address: '10 Rue de la Paix 75002 Paris' })
    );
  });

  it('reste utilisable en saisie manuelle si l’API est en panne', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { input, onChange } = setup();
    await userEvent.type(input, 'adresse manuelle');

    await new Promise((r) => setTimeout(r, 300));
    expect(input).toBeEnabled();
    expect(input).toHaveValue('adresse manuelle');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith('adresse manuelle');
  });
});
