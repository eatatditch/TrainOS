const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

// Historical/default credentials and common temporary-password patterns must
// never become a user's long-term credential. Punctuation is ignored so a
// cosmetic suffix does not make an old default acceptable.
const BLOCKED_PASSWORDS = new Set([
  "changeme123",
  "ditch2024",
  "ditch2025",
  "ditch2026",
  "password123",
  "password1234",
  "trainos2024",
  "trainos2025",
  "trainos2026",
  "welcome123",
]);

function canonicalizePassword(password: string) {
  return password
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") {
    return "Enter a valid password";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwords must contain at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `Passwords must be no more than ${MAX_PASSWORD_BYTES} bytes`;
  }

  if (BLOCKED_PASSWORDS.has(canonicalizePassword(password))) {
    return "Choose a new password that is not a known or default password";
  }

  return null;
}

