import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

afterEach(() => { cleanup(); });

describe('HelpTooltip', () => {
  it('hides content by default and shows on click', () => {
    render(<HelpTooltip content="Explanation here" />);
    expect(screen.queryByText('Explanation here')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ajuda/i }));
    expect(screen.getByText('Explanation here')).toBeDefined();
  });

  it('closes when clicking outside', () => {
    render(
      <>
        <HelpTooltip content="Tip" />
        <div data-testid="outside">outside</div>
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: /ajuda/i }));
    expect(screen.getByText('Tip')).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Tip')).toBeNull();
  });
});
