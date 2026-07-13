// Shared auth validation helpers — single source of truth for the frontend.
// Mirrors the backend `passwordRule` in backend/src/validators/auth.validators.ts
// (min 8 chars, upper + lower + digit + special character).

export const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_HINT =
  "Min 8 characters — must include uppercase, lowercase, a digit & a special character";

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return PASSWORD_RE.test(password);
}

/** Per-rule breakdown for real-time password checklists. */
export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(password),
  };
}
