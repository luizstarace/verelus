import { describe, it, expect } from 'vitest';
import { resolveProvider } from '@/lib/atalaia/whatsapp/provider';

const baseBiz = {
  id: 'biz-123',
  whatsapp_provider: 'evolution' as const,
  whatsapp_byo: false,
  whatsapp_number: null as string | null,
  bsp_phone_number_id: null as string | null,
  bsp_subaccount_id: null as string | null,
  bsp_evolution_bridge_until: null as string | null,
  twilio_phone_sid: null as string | null,
  twilio_sender_sid: null as string | null,
};

describe('resolveProvider', () => {
  it('defaults to evolution with no bridge for a fresh business', () => {
    const ctx = resolveProvider(baseBiz);
    expect(ctx.provider).toBe('evolution');
    expect(ctx.evolution_instance).toBe('atalaia_biz-123');
    expect(ctx.zenvia_phone_number_id).toBeNull();
    expect(ctx.zenvia_subaccount_id).toBeNull();
    expect(ctx.zenvia_phone).toBeNull();
    expect(ctx.bridge_active).toBe(false);
  });

  it('reflects zenvia provider with phone number after migration', () => {
    const ctx = resolveProvider({
      ...baseBiz,
      whatsapp_provider: 'zenvia',
      whatsapp_number: '5511999999999',
      bsp_phone_number_id: 'pn-abc',
      bsp_subaccount_id: 'sub-xyz',
    });
    expect(ctx.provider).toBe('zenvia');
    expect(ctx.zenvia_phone).toBe('5511999999999');
    expect(ctx.zenvia_phone_number_id).toBe('pn-abc');
    expect(ctx.zenvia_subaccount_id).toBe('sub-xyz');
  });

  it('does not expose zenvia_phone for evolution provider, even if whatsapp_number is set', () => {
    const ctx = resolveProvider({
      ...baseBiz,
      whatsapp_provider: 'evolution',
      whatsapp_number: '5511988888888',
    });
    expect(ctx.zenvia_phone).toBeNull();
  });

  it('marks bridge_active=true when bsp_evolution_bridge_until is in the future', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const ctx = resolveProvider({ ...baseBiz, bsp_evolution_bridge_until: future });
    expect(ctx.bridge_active).toBe(true);
  });

  it('marks bridge_active=false when bsp_evolution_bridge_until is in the past', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const ctx = resolveProvider({ ...baseBiz, bsp_evolution_bridge_until: past });
    expect(ctx.bridge_active).toBe(false);
  });

  it('uses the injected `now` clock for bridge expiry comparison', () => {
    const t = '2026-06-01T12:00:00Z';
    const expires = '2026-06-01T11:59:59Z';
    const ctx = resolveProvider(
      { ...baseBiz, bsp_evolution_bridge_until: expires },
      new Date(t)
    );
    expect(ctx.bridge_active).toBe(false);
  });

  it('still computes evolution_instance for zenvia businesses (used during bridge)', () => {
    const ctx = resolveProvider({
      ...baseBiz,
      whatsapp_provider: 'zenvia',
      whatsapp_number: '5511999999999',
    });
    expect(ctx.evolution_instance).toBe('atalaia_biz-123');
  });
});
