export function displayUserName(
  u:
    | {
        firstName: string | null;
        lastName: string | null;
        username: string | null;
      }
    | null
    | undefined,
): string {
  if (!u) return 'User';
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  if (u.username) return `@${u.username}`;
  return 'User';
}
