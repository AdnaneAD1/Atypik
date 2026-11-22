import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormDialogShell } from '../form-dialog-shell';

describe('FormDialogShell', () => {
  it('affiche l’image de marque et son bandeau', () => {
    const { container } = render(
      <FormDialogShell image="/auth-side.jpg" caption="Pour des enfants exceptionnels">
        <p>contenu</p>
      </FormDialogShell>
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/auth-side.jpg');
    // Le bandeau existe en version mobile (fine bande) et desktop (sur l'image)
    expect(screen.getAllByText('Pour des enfants exceptionnels').length).toBeGreaterThan(0);
  });

  it('n’affiche pas la photo en bandeau mobile (masquée avant sm)', () => {
    const { container } = render(
      <FormDialogShell image="/auth-side.jpg" caption="Test">
        <p>contenu</p>
      </FormDialogShell>
    );
    const panel = container.querySelector('img')?.closest('div');
    expect(panel?.className).toContain('sm:block');
    expect(panel?.className).toContain('hidden');
  });

  it('rend le contenu du formulaire dans le panneau droit', () => {
    render(
      <FormDialogShell image="/formations-side.jpg" caption="Test">
        <label htmlFor="nom">Nom</label>
        <input id="nom" />
      </FormDialogShell>
    );
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
  });
});
