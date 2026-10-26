/**
 * Mirrors lib/features/auth/domain/entities/account.dart. Chosen once at
 * registration and fixed from then on: only a host can create a room; a
 * general user can join rooms and sessions they've been given access to.
 */
export type AccountRole = "host" | "general";

export type Account = {
  id: string;
  displayName: string;
  role: AccountRole;
};
