const KEY = "focusguard_has_seen_onboarding";

/** Device-local "shown once" flag — the web counterpart to
 * SettingsRepository.getHasSeenOnboarding/setHasSeenOnboarding, which is
 * itself device-local (SharedPreferences), not account-synced. Wrapped in
 * try/catch: localStorage can throw in a private window or with site data
 * blocked, and onboarding simply showing again in that case is harmless. */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(KEY, "true");
  } catch {
    // Nothing to do — see the doc comment above.
  }
}
