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
    expect(screen.getByText('Pour des enfants exceptionnels')).toBeInTheDocument();
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
