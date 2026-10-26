import Link from "next/link";

/**
 * Where the verification email sends the user back. Supabase confirms
 * the account server-side before ever redirecting here, so this page's
 * only job is to say so plainly and point to sign-in — no session check,
 * no branching, nothing that can flicker or show the wrong message.
 */
export default function EmailVerifiedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-6 px-8 text-center">
      <h1 className="text-[26px] font-semibold tracking-[-0.2px]">
        Email verified successfully
      </h1>
      <p className="text-[15px] text-on-background-muted">
        You can return to FocusGuard and sign in.
      </p>
      <Link href="/sign-in" className="text-[15px] font-medium text-accent">
        Go to sign in
      </Link>
    </main>
  );
}
