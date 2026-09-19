/**
 * Phone number sanitization and URL formatting.
 * Strictly permits only digits and an optional leading '+'.
 * Prevents URL injection or malformed scheme attacks.
 */

export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return '';
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export function formatTelUrl(phone: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  return sanitized ? `tel:${sanitized}` : '#';
}

export function formatSmsUrl(phone: string, messageBody?: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  if (!sanitized) return '#';
  if (messageBody) {
    return `sms:${sanitized}?body=${encodeURIComponent(messageBody)}`;
  }
  return `sms:${sanitized}`;
}

export function formatWhatsAppUrl(phone: string, messageBody?: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  if (!sanitized) return '#';
  // wa.me expects country code without leading '+'
  const cleanNumber = sanitized.replace(/^\+/, '');
  if (messageBody) {
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageBody)}`;
  }
  return `https://wa.me/${cleanNumber}`;
}
