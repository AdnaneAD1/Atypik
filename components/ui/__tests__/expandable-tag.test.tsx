import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExpandableTag } from '../expandable-tag';

describe('ExpandableTag', () => {
  it('affiche le texte intégral quand il est court', () => {
    render(<ExpandableTag text="Calme" />);
    const el = screen.getByText('Calme');
    expect(el.tagName).toBe('SPAN');
    expect(el.closest('button')).toBeNull();
  });

  it('tronque le texte long et le déplie au clic', async () => {
    const long = "A besoin d'une tablette au cours du transport";
    render(<ExpandableTag text={long} />);

    // Tronqué : le texte complet n'est pas visible, mais le bouton existe
    const btn = screen.getByRole('button', { name: /tablette/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn.textContent).not.toBe(long);
    expect(btn.textContent).toContain('…');

    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(btn.textContent).toContain(long);
  });

  it('respecte le seuil personnalisé', () => {
    render(<ExpandableTag text="Bonne humeur" maxChars={5} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
