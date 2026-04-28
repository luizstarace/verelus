// Meta Pixel client-side helpers. Server-side conversions (Conversions API)
// are out of scope until volume justifies the integration overhead.

declare global {
  interface Window {
    fbq?: (
      command: 'init' | 'track' | 'trackCustom',
      eventOrPixel: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

type MetaStandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'StartTrial'
  | 'Subscribe'
  | 'Purchase';

export function trackMeta(event: MetaStandardEvent, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, params);
}

export function trackMetaCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('trackCustom', event, params);
}
