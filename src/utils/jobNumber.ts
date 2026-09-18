/**
 * Job ID format: {CUSTOMER_SHORT}_{ENGINEER_SHORT}_{####}
 * Example: ALWESAM + Eng. HASHMAI → WE_HASH_0001
 */

/** Build a short uppercase code from a name (letters only). */
export function makeShortCode(name: string, maxLen = 4): string {
  const cleaned = name
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .toUpperCase();
  if (!cleaned) return 'XX';

  // Prefer known multi-word brands: take first letters of significant words
  const stop = new Set(['AL', 'EL', 'THE', 'AND', 'OF', 'CO', 'LLC', 'LTD', 'ENG', 'MR', 'MS']);
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0 && !stop.has(w));

  if (words.length >= 2) {
    // e.g. AL WESAM → WE, GULF ROCK → GR
    const initials = words.map((w) => w[0]).join('');
    if (initials.length >= 2) return initials.slice(0, maxLen);
  }

  // Single word: take up to maxLen chars
  const one = words[0] || cleaned.replace(/\s/g, '');
  return one.slice(0, maxLen).padEnd(Math.min(2, maxLen), 'X');
}

/** Normalize user-entered short code */
export function normalizeShortCode(code: string, fallback = 'XX', maxLen = 6): string {
  const c = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!c) return fallback.slice(0, maxLen);
  return c.slice(0, maxLen);
}

/**
 * Next sequence number for a given CUST_ENG prefix among existing job numbers.
 * Scans jobNos like WE_HASH_0007 and returns 8.
 */
export function nextJobSequence(existingJobNos: string[], custCode: string, engCode: string): number {
  const prefix = `${custCode}_${engCode}_`;
  let max = -1;
  for (const no of existingJobNos) {
    if (!no.startsWith(prefix)) continue;
    const tail = no.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

/** Format sequence as 4+ digits: 0 → 0000, 12 → 0012 */
export function formatSeq(seq: number, width = 4): string {
  return String(Math.max(0, seq)).padStart(width, '0');
}

/**
 * Generate full job number: WE_HASH_0000
 */
export function generateJobNo(
  customerShort: string,
  engineerShort: string,
  existingJobNos: string[]
): string {
  const cust = normalizeShortCode(customerShort, 'CUST');
  const eng = normalizeShortCode(engineerShort, 'ENG');
  const seq = nextJobSequence(existingJobNos, cust, eng);
  return `${cust}_${eng}_${formatSeq(seq)}`;
}
