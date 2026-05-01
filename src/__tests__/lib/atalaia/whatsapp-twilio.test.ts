import { describe, it, expect } from 'vitest';
import { resolveProvider } from '@/lib/atalaia/whatsapp/provider';
import { parseInbound } from '@/lib/atalaia/whatsapp/twilio/messaging';
import { extractAreaCode } from '@/lib/atalaia/whatsapp/twilio/numbers';
import { mapSenderStatusToKyc } from '@/lib/atalaia/whatsapp/twilio/sender';

const baseBiz = {
  id: 'biz-twilio-1',
  whatsapp_provider: 'twilio' as const,
  whatsapp_byo: false,
  whatsapp_number: '5511988887777',
  bsp_phone_number_id: null as string | null,
  bsp_subaccount_id: null as string | null,
  bsp_evolution_bridge_until: null as string | null,
  twilio_phone_sid: 'PN123',
  twilio_sender_sid: 'SN456',
};

describe('resolveProvider with twilio', () => {
  it('exposes twilio_phone when provider is twilio', () => {
    const ctx = resolveProvider(baseBiz);
    expect(ctx.provider).toBe('twilio');
    expect(ctx.twilio_phone).toBe('5511988887777');
    expect(ctx.twilio_phone_sid).toBe('PN123');
    expect(ctx.twilio_sender_sid).toBe('SN456');
  });

  it('does not leak twilio_phone for non-twilio providers', () => {
    const ctx = resolveProvider({ ...baseBiz, whatsapp_provider: 'evolution' });
    expect(ctx.twilio_phone).toBeNull();
  });

  it('always includes evolution_instance for fallback paths', () => {
    const ctx = resolveProvider(baseBiz);
    expect(ctx.evolution_instance).toBe('atalaia_biz-twilio-1');
  });
});

describe('Twilio parseInbound', () => {
  it('extracts message id, from, to, text, and pushName', () => {
    const form = {
      MessageSid: 'SM_test_001',
      From: 'whatsapp:+5511999999999',
      To: 'whatsapp:+5511888888888',
      Body: 'Olá, vocês atendem hoje?',
      ProfileName: 'Cliente Teste',
    };
    const parsed = parseInbound(form);
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe('SM_test_001');
    expect(parsed!.from).toBe('5511999999999');
    expect(parsed!.to).toBe('5511888888888');
    expect(parsed!.text).toBe('Olá, vocês atendem hoje?');
    expect(parsed!.pushName).toBe('Cliente Teste');
  });

  it('strips whatsapp: prefix and leading + from JIDs', () => {
    const parsed = parseInbound({
      MessageSid: 'SM_x',
      From: 'whatsapp:+5511777777777',
      To: 'whatsapp:+5511666666666',
      Body: 'oi',
    });
    expect(parsed!.from).toBe('5511777777777');
    expect(parsed!.to).toBe('5511666666666');
  });

  it('falls back to SmsMessageSid when MessageSid missing', () => {
    const parsed = parseInbound({
      SmsMessageSid: 'SM_fallback',
      From: 'whatsapp:+5511999',
      To: 'whatsapp:+5511888',
      Body: 'oi',
    });
    expect(parsed!.id).toBe('SM_fallback');
  });

  it('returns null for delivery receipts (no Body)', () => {
    expect(
      parseInbound({
        MessageSid: 'SM_x',
        MessageStatus: 'delivered',
        From: 'whatsapp:+5511999',
        To: 'whatsapp:+5511888',
      })
    ).toBeNull();
  });

  it('returns null when required fields missing', () => {
    expect(parseInbound({})).toBeNull();
    expect(parseInbound({ MessageSid: 'x', From: 'whatsapp:+1', Body: 'hi' })).toBeNull();
  });
});

describe('extractAreaCode', () => {
  it('extracts DDD from BR E.164 with country code', () => {
    expect(extractAreaCode('+5511999999999')).toBe('11');
    expect(extractAreaCode('5521988887777')).toBe('21');
  });

  it('extracts DDD from a phone without country code', () => {
    expect(extractAreaCode('11999999999')).toBe('11');
  });

  it('handles formatted numbers', () => {
    expect(extractAreaCode('(31) 9 9888-7777')).toBe('31');
  });

  it('falls back to 11 when phone is null/empty/short', () => {
    expect(extractAreaCode(null)).toBe('11');
    expect(extractAreaCode('')).toBe('11');
    expect(extractAreaCode('123')).toBe('11');
  });
});

describe('mapSenderStatusToKyc', () => {
  it('maps ONLINE to approved', () => {
    expect(mapSenderStatusToKyc('ONLINE')).toBe('approved');
  });

  it('maps FAILED and DELETED to rejected', () => {
    expect(mapSenderStatusToKyc('FAILED')).toBe('rejected');
    expect(mapSenderStatusToKyc('DELETED')).toBe('rejected');
  });

  it('maps in-flight states to pending', () => {
    expect(mapSenderStatusToKyc('CREATING')).toBe('pending');
    expect(mapSenderStatusToKyc('REGISTERING')).toBe('pending');
    expect(mapSenderStatusToKyc('VERIFYING')).toBe('pending');
    expect(mapSenderStatusToKyc('OFFLINE')).toBe('pending');
  });

  it('treats null status as pending', () => {
    expect(mapSenderStatusToKyc(null)).toBe('pending');
  });
});
