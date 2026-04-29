/**
 * Shared validation utilities used across admin and hotel-admin flows.
 */

/**
 * RFC 5321/5322 aligned email validation regex.
 * - Validates local part, domain labels, and TLD structure.
 * - Requires TLD to be at least 2 alphabetic characters (covers .io, .co, .museum, etc.).
 * - Does not support IP address literals or quoted strings in local parts.
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
