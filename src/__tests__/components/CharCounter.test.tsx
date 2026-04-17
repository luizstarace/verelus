import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CharCounter } from '@/components/ui/CharCounter';

afterEach(() => { cleanup(); });

describe('CharCounter', () => {
  it('renders current/max', () => {
    render(<CharCounter current={50} max={100} />);
    expect(screen.getByText('50/100')).toBeDefined();
  });

  it('uses muted color below 80%', () => {
    const { container } = render(<CharCounter current={70} max={100} />);
    expect(container.querySelector('.text-brand-muted')).toBeDefined();
  });

  it('uses yellow color between 80-95%', () => {
    const { container } = render(<CharCounter current={85} max={100} />);
    expect(container.querySelector('.text-yellow-400')).toBeDefined();
  });

  it('uses orange color above 95%', () => {
    const { container } = render(<CharCounter current={97} max={100} />);
    expect(container.querySelector('.text-orange-400')).toBeDefined();
  });
});
