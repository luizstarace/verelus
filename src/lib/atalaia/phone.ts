// Generate all plausible formats of a BR phone number for whitelist match.
// WhatsApp remoteJid typically comes as "55DDDNNNNNNNN" (13 digits for mobile);
// user may have typed "DDDNNNNNNNN" (11) or even dropped the 9th digit (10).
export function phoneVariants(digits: string): string[] {
  const d = digits.replace(/\D/g, '');
  const variants = new Set<string>([d]);
  if (d.startsWith('55') && d.length >= 12) {
    const withoutCountry = d.slice(2);
    variants.add(withoutCountry);
    // Drop leading 9 from mobile (BR 9th digit was mandated 2012+, old contacts may lack)
    if (withoutCountry.length === 11 && withoutCountry[2] === '9') {
      variants.add(withoutCountry.slice(0, 2) + withoutCountry.slice(3));
    }
  }
  if (d.length === 11 && d[2] === '9') {
    variants.add(d.slice(0, 2) + d.slice(3));
    variants.add('55' + d);
  }
  if (d.length === 10) {
    variants.add('55' + d);
    variants.add(d.slice(0, 2) + '9' + d.slice(2));
    variants.add('55' + d.slice(0, 2) + '9' + d.slice(2));
  }
  return Array.from(variants);
}

export function phonesMatch(a: string, b: string): boolean {
  const aVariants = new Set(phoneVariants(a));
  return phoneVariants(b).some((v) => aVariants.has(v));
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
