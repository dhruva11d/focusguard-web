import Link from "next/link";

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  const success = verified === "1";
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-6 px-8 text-center">
      <h1 className="text-[26px] font-semibold tracking-[-0.2px]">{success ? "Email verified successfully" : "Verification link is invalid or expired"}</h1>
      <p className="text-[15px] text-on-background-muted">{success ? "You can return to FocusGuard and sign in." : "Request a new verification link from the sign-in screen."}</p>
      <Link href="/sign-in" className="text-[15px] font-medium text-accent">Go to sign in</Link>
    </main>
  );
}
