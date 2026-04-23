// Canonical hours format: Record<'mon'|'tue'|...|'sun', {open, close}>
// Accepts legacy array format [{day:'Segunda',enabled,open,close}] from old wizard
// and normalizes on write, so ai-context + webhook filter always see canonical shape.

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const VALID_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const PT_DAY_TO_KEY: Record<string, DayKey> = {
  segunda: 'mon', 'segunda-feira': 'mon',
  terca: 'tue', 'terca-feira': 'tue', 'terça': 'tue', 'terça-feira': 'tue',
  quarta: 'wed', 'quarta-feira': 'wed',
  quinta: 'thu', 'quinta-feira': 'thu',
  sexta: 'fri', 'sexta-feira': 'fri',
  sabado: 'sat', 'sábado': 'sat',
  domingo: 'sun',
};

function toKey(raw: unknown): DayKey | null {
  if (typeof raw !== 'string') return null;
  const lower = raw.trim().toLowerCase();
  if ((VALID_KEYS as string[]).includes(lower)) return lower as DayKey;
  return PT_DAY_TO_KEY[lower] ?? null;
}

function isTime(s: unknown): s is string {
  return typeof s === 'string' && /^\d{1,2}:\d{2}$/.test(s);
}

export function normalizeHours(input: unknown): Record<DayKey, { open: string; close: string }> {
  const out = {} as Record<DayKey, { open: string; close: string }>;
  if (!input) return out;

  // Array from legacy wizard: [{day|key, enabled, open, close}, ...]
  if (Array.isArray(input)) {
    for (const entry of input) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      if (e.enabled === false) continue;
      const key = toKey(e.key ?? e.day);
      if (!key) continue;
      const open = isTime(e.open) ? (e.open as string) : null;
      const close = isTime(e.close) ? (e.close as string) : null;
      if (!open || !close) continue;
      out[key] = { open, close };
    }
    return out;
  }

  // Record format
  if (typeof input === 'object') {
    for (const [rawKey, rawVal] of Object.entries(input as Record<string, unknown>)) {
      const key = toKey(rawKey);
      if (!key) continue;
      if (!rawVal || typeof rawVal !== 'object') continue;
      const v = rawVal as Record<string, unknown>;
      const open = isTime(v.open) ? (v.open as string) : null;
      const close = isTime(v.close) ? (v.close as string) : null;
      if (!open || !close) continue;
      out[key] = { open, close };
    }
    return out;
  }

  return out;
}

// For webhook filter: returns true if `now` falls inside any active day entry.
// BR timezone fixed UTC-3 (no DST since 2019).
// getUTCDay: 0=Sun..6=Sat. VALID_KEYS: [mon,tue,wed,thu,fri,sat,sun] (0=mon..6=sun).
export function isInsideBusinessHours(
  hours: unknown,
  now: Date = new Date()
): boolean {
  const normalized = normalizeHours(hours);
  const brNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const utcDay = brNow.getUTCDay();
  const keyIdx = utcDay === 0 ? 6 : utcDay - 1;
  const day = normalized[VALID_KEYS[keyIdx]];
  if (!day) return false;

  const [oH, oM] = day.open.split(':').map(Number);
  const [cH, cM] = day.close.split(':').map(Number);
  const nowMin = brNow.getUTCHours() * 60 + brNow.getUTCMinutes();
  const openMin = oH * 60 + oM;
  const closeMin = cH * 60 + cM;

  // Support ranges that cross midnight (e.g. 20:00-02:00): if close <= open, range wraps
  if (closeMin <= openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}
