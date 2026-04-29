/**
 * Shared validation utilities used across admin and hotel-admin flows.
 */

/**
 * RFC 5321/5322 aligned email validation regex.
 * Validates the structure without being overly permissive.
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Returns true if the given ISO timestamp is in the past (i.e. expired).
 * Returns false if expiresAt is null/undefined (treat as non-expiring).
 */
export function isTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
