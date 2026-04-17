import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/use-toast';

afterEach(() => {
  cleanup();
});

function Trigger({ msg }: { msg: string }) {
  const t = useToast();
  return <button onClick={() => t.success(msg)}>Fire</button>;
}

describe('Toast', () => {
  it('renders toast when triggered and auto-dismisses after 2s', async () => {
    vi.useFakeTimers();
    render(
      <>
        <ToastContainer />
        <Trigger msg="Copied!" />
      </>
    );
    act(() => { screen.getByText('Fire').click(); });
    expect(screen.getByText('Copied!')).toBeDefined();
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.queryByText('Copied!')).toBeNull();
    vi.useRealTimers();
  });

  it('supports success, error, and info variants', () => {
    vi.useFakeTimers();
    const Multi = () => {
      const t = useToast();
      return (
        <>
          <button onClick={() => t.success('S')}>s</button>
          <button onClick={() => t.error('E')}>e</button>
          <button onClick={() => t.info('I')}>i</button>
        </>
      );
    };
    render(<><ToastContainer /><Multi /></>);
    act(() => { screen.getByText('s').click(); });
    act(() => { screen.getByText('e').click(); });
    act(() => { screen.getByText('i').click(); });
    expect(screen.getByText('S')).toBeDefined();
    expect(screen.getByText('E')).toBeDefined();
    expect(screen.getByText('I')).toBeDefined();
    vi.useRealTimers();
  });
});
