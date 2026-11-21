import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logo } from '../logo';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('next/image', () => ({
  default: ({ priority, fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; fill?: boolean }) => (
    <img {...props} />
  ),
}));

describe('Logo', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('affiche le logo horizontal officiel depuis /public', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: /atypik driver/i });
    expect(img).toHaveAttribute('src', '/logo-horizontal.png');
  });

  it('navigue vers / au clic', async () => {
    render(<Logo />);
    await userEvent.click(screen.getByRole('link', { name: /atypik driver/i }));
    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('appelle onClick personnalisé au lieu de naviguer', async () => {
    const onClick = vi.fn();
    render(<Logo onClick={onClick} />);
    await userEvent.click(screen.getByRole('link', { name: /atypik driver/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
