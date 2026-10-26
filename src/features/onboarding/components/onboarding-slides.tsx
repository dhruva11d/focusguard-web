import type { OnboardingSlide } from "../types";

/**
 * Three slides, ported in spirit from onboarding_page.dart's `_slides` —
 * not in content, since the Flutter copy is about physical phone
 * placement and call exemption, neither of which exists on the web (see
 * usePersonalFocusSession's doc comment on why a browser tab can't tell
 * a real phone call apart from any other interruption). These three cover
 * the web app's actual mechanics instead: keep the tab visible, a switch
 * away ends the session immediately, and Community rooms.
 *
 * `image` points at the generated doodle illustrations under
 * /public/images, matching the house style established by pickup.png/
 * vibrate.png/empty-calendar.png; `icon` stays defined as the fallback
 * `OnboardingView` falls back to if an `image` is ever unset again.
 */
export const onboardingSlides: OnboardingSlide[] = [
  {
    image: "/images/onboarding-focus.png",
    icon: <WindowClockIcon />,
    title: "Keep this tab open",
    body: "Start a focus session, then leave this tab open and visible — that's what keeps monitoring active.",
  },
  {
    image: "/images/onboarding-interrupt.png",
    icon: <WindowAlertIcon />,
    title: "Switch away, and it ends",
    body: "Leaving the tab — switching apps, locking your screen, opening another tab — ends the session right away and sounds an alarm.",
  },
  {
    image: "/images/onboarding-together.png",
    icon: <PeopleIcon />,
    title: "Focus together",
    body: "Join a room and stay accountable alongside everyone else in it, all focusing at the same time.",
  },
];

function WindowClockIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="4.5" width="19" height="14" rx="2" />
      <path d="M2.5 8h19" strokeLinecap="round" />
      <circle cx="16.5" cy="14.5" r="3.6" />
      <path d="M16.5 12.7v1.9l1.3 1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WindowAlertIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="4.5" width="19" height="14" rx="2" transform="rotate(-6 12 11.5)" />
      <path d="M19 3.5l1.6-1.2M21 6.3h2M18.5 1.2l.8 1.8" strokeLinecap="round" />
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12 16.5v2.3" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.8 20c0-3.3 2.6-6 5.7-6s5.7 2.7 5.7 6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.3 14.3c2.3.3 4.1 2.4 4.1 5" strokeLinecap="round" />
    </svg>
  );
}
