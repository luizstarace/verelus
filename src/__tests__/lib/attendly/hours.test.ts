import { describe, it, expect } from 'vitest';
import { normalizeHours, isInsideBusinessHours } from '@/lib/attendly/hours';

describe('normalizeHours', () => {
  it('normalizes canonical record with short keys', () => {
    const input = {
      mon: { open: '09:00', close: '18:00' },
      tue: { open: '09:00', close: '18:00' },
    };
    const result = normalizeHours(input);
    expect(result.mon).toEqual({ open: '09:00', close: '18:00' });
    expect(result.tue).toEqual({ open: '09:00', close: '18:00' });
  });

  it('normalizes legacy array format with PT day names', () => {
    const input = [
      { day: 'Segunda', enabled: true, open: '09:00', close: '18:00' },
      { day: 'Terça', enabled: true, open: '10:00', close: '17:00' },
      { day: 'Sábado', enabled: true, open: '09:00', close: '13:00' },
    ];
    const result = normalizeHours(input);
    expect(result.mon).toEqual({ open: '09:00', close: '18:00' });
    expect(result.tue).toEqual({ open: '10:00', close: '17:00' });
    expect(result.sat).toEqual({ open: '09:00', close: '13:00' });
  });

  it('skips entries with enabled=false in array form', () => {
    const input = [
      { day: 'Segunda', enabled: true, open: '09:00', close: '18:00' },
      { day: 'Terça', enabled: false, open: '09:00', close: '18:00' },
    ];
    const result = normalizeHours(input);
    expect(result.mon).toBeDefined();
    expect(result.tue).toBeUndefined();
  });

  it('drops entries with invalid time format', () => {
    const input = {
      mon: { open: '9am', close: '6pm' },
      tue: { open: '09:00', close: '18:00' },
    };
    const result = normalizeHours(input);
    expect(result.mon).toBeUndefined();
    expect(result.tue).toBeDefined();
  });

  it('drops entries with missing open or close', () => {
    const input = {
      mon: { open: '09:00' },
      tue: { close: '18:00' },
    } as unknown;
    const result = normalizeHours(input);
    expect(result.mon).toBeUndefined();
    expect(result.tue).toBeUndefined();
  });

  it('handles PT accented day names (terça, sábado)', () => {
    const input = [
      { day: 'terça-feira', enabled: true, open: '08:00', close: '17:00' },
      { day: 'sábado', enabled: true, open: '10:00', close: '14:00' },
    ];
    const result = normalizeHours(input);
    expect(result.tue).toEqual({ open: '08:00', close: '17:00' });
    expect(result.sat).toEqual({ open: '10:00', close: '14:00' });
  });

  it('handles PT without accents (terca, sabado)', () => {
    const input = [
      { day: 'terca', enabled: true, open: '08:00', close: '17:00' },
      { day: 'sabado', enabled: true, open: '10:00', close: '14:00' },
    ];
    const result = normalizeHours(input);
    expect(result.tue).toEqual({ open: '08:00', close: '17:00' });
    expect(result.sat).toEqual({ open: '10:00', close: '14:00' });
  });

  it('returns empty object for null/undefined', () => {
    expect(normalizeHours(null)).toEqual({});
    expect(normalizeHours(undefined)).toEqual({});
  });

  it('returns empty object for non-object input', () => {
    expect(normalizeHours('string')).toEqual({});
    expect(normalizeHours(123)).toEqual({});
  });

  it('ignores unknown day keys', () => {
    const input = {
      mon: { open: '09:00', close: '18:00' },
      banana: { open: '10:00', close: '11:00' },
    };
    const result = normalizeHours(input);
    expect(result.mon).toBeDefined();
    expect((result as Record<string, unknown>).banana).toBeUndefined();
  });
});

describe('isInsideBusinessHours', () => {
  // All times interpreted as UTC-3 (BR timezone, no DST).
  // `now` is a Date in UTC; function subtracts 3h internally.
  // Helper: build a UTC date that represents a given BR local time.
  // BR local 14:00 on 2026-04-27 (Mon) = UTC 17:00 same day.
  function brDate(year: number, month: number, day: number, brHour: number, brMin = 0) {
    return new Date(Date.UTC(year, month - 1, day, brHour + 3, brMin));
  }

  const HOURS = {
    mon: { open: '09:00', close: '18:00' },
    tue: { open: '09:00', close: '18:00' },
    wed: { open: '09:00', close: '18:00' },
    thu: { open: '09:00', close: '18:00' },
    fri: { open: '09:00', close: '18:00' },
  };

  it('returns true for time inside business hours on a weekday', () => {
    // Monday 2026-04-27, BR 14:00
    expect(isInsideBusinessHours(HOURS, brDate(2026, 4, 27, 14))).toBe(true);
  });

  it('returns false before open', () => {
    // Monday 2026-04-27, BR 08:00
    expect(isInsideBusinessHours(HOURS, brDate(2026, 4, 27, 8))).toBe(false);
  });

  it('returns false exactly at close time (close is exclusive)', () => {
    // Monday BR 18:00
    expect(isInsideBusinessHours(HOURS, brDate(2026, 4, 27, 18))).toBe(false);
  });

  it('returns true exactly at open time (open is inclusive)', () => {
    expect(isInsideBusinessHours(HOURS, brDate(2026, 4, 27, 9))).toBe(true);
  });

  it('returns false on a day not in the schedule', () => {
    // Saturday 2026-04-25 — not in HOURS
    expect(isInsideBusinessHours(HOURS, brDate(2026, 4, 25, 14))).toBe(false);
  });

  it('handles Sunday correctly (weekday index 6)', () => {
    const sundayOnly = { sun: { open: '10:00', close: '14:00' } };
    // Sunday 2026-04-26 BR 12:00
    expect(isInsideBusinessHours(sundayOnly, brDate(2026, 4, 26, 12))).toBe(true);
    // Sunday BR 15:00 (outside)
    expect(isInsideBusinessHours(sundayOnly, brDate(2026, 4, 26, 15))).toBe(false);
  });

  it('supports ranges crossing midnight (e.g. 20:00 to 02:00 next day)', () => {
    const nightShift = { fri: { open: '20:00', close: '02:00' } };
    // Friday 2026-04-24 BR 22:00 → inside
    expect(isInsideBusinessHours(nightShift, brDate(2026, 4, 24, 22))).toBe(true);
    // Friday 2026-04-24 BR 01:00 → inside (same weekday entry, wrapping)
    expect(isInsideBusinessHours(nightShift, brDate(2026, 4, 24, 1))).toBe(true);
    // Friday BR 19:00 → outside
    expect(isInsideBusinessHours(nightShift, brDate(2026, 4, 24, 19))).toBe(false);
    // Friday BR 03:00 → outside
    expect(isInsideBusinessHours(nightShift, brDate(2026, 4, 24, 3))).toBe(false);
  });

  it('returns false for empty hours', () => {
    expect(isInsideBusinessHours({}, brDate(2026, 4, 27, 14))).toBe(false);
  });

  it('normalizes legacy array input before checking', () => {
    const legacy = [
      { day: 'Segunda', enabled: true, open: '09:00', close: '18:00' },
    ];
    expect(isInsideBusinessHours(legacy, brDate(2026, 4, 27, 14))).toBe(true);
  });
});
