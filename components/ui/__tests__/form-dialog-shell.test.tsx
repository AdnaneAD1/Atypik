import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormDialogShell } from '../form-dialog-shell';

describe('FormDialogShell', () => {
  it('affiche le bandeau de marque sans panneau image', () => {
    const { container } = render(
      <FormDialogShell caption="Pour des enfants exceptionnels">
        <p>contenu</p>
      </FormDialogShell>
    );
    expect(screen.getByText('Pour des enfants exceptionnels')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('rend le contenu du formulaire', () => {
    render(
      <FormDialogShell caption="Test">
        <label htmlFor="nom">Nom</label>
        <input id="nom" />
      </FormDialogShell>
    );
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
  });
});
