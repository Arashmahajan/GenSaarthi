/**
 * Careful Indian Rupee money parser and formatter.
 * Handles formats like:
 *   - "₹1,450"
 *   - "Rs. 15000"
 *   - "INR 1,45,000.50"
 *   - "Rs 5000/-"
 *   - "Rs. 12,500.00"
 * Returns null whenever parsing is uncertain or ambiguous. Never guesses.
 */

const CURRENCY_PREFIX_REGEX = /(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)(?:\s*\/-)?/i;
const CURRENCY_SUFFIX_REGEX = /([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:\/-|\s*(?:₹|rs\.?|inr))/i;
const STANDALONE_NUMBER_REGEX = /^([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)$/;

export function parseAmountValue(input: string | null | undefined): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Guard against obvious non-monetary text like phone numbers (10 digits starting with 6-9) or dates (e.g. 15-08-2026)
  if (/^(?:\+?91)?[6-9]\d{9}$/.test(trimmed.replace(/[\s-]/g, ''))) {
    return null;
  }
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(trimmed)) {
    return null;
  }

  // 1. Try currency prefix: ₹1,450, Rs. 15000, INR 1,45,000.50, Rs 5000/-
  let match = trimmed.match(CURRENCY_PREFIX_REGEX);
  if (match && match[1]) {
    return cleanAndParseNumber(match[1]);
  }

  // 2. Try currency suffix: 5000/-, 1500 Rs
  match = trimmed.match(CURRENCY_SUFFIX_REGEX);
  if (match && match[1]) {
    return cleanAndParseNumber(match[1]);
  }

  // 3. Try clean standalone number
  match = trimmed.match(STANDALONE_NUMBER_REGEX);
  if (match && match[1]) {
    return cleanAndParseNumber(match[1]);
  }

  return null;
}

function cleanAndParseNumber(numStr: string): number | null {
  const clean = numStr.replace(/,/g, '').trim();
  const num = parseFloat(clean);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return null;
  }
  return num;
}

/**
 * Formats a numeric rupee amount using Indian numbering system (e.g. ₹1,45,000)
 */
export function formatRupees(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const formatRupee = formatRupees;

