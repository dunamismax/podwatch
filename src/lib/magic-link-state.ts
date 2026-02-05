let pendingMagicLinkEmail: string | null = null;

export function setPendingMagicLinkEmail(email: string) {
  pendingMagicLinkEmail = email.trim().toLowerCase();
}

export function getPendingMagicLinkEmail() {
  return pendingMagicLinkEmail;
}

export function clearPendingMagicLinkEmail() {
  pendingMagicLinkEmail = null;
}
