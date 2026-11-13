export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div
        role="status"
        aria-live="polite"
        className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-hairline bg-surface px-8 py-7 text-center shadow-lg"
      >
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-accent/25 border-t-accent"
        />
        <div>
          <p className="text-[16px] font-semibold">Connecting to the server…</p>
          <p className="mt-1 text-[13px] text-on-background-muted">
            Starting the server after inactivity can take about a minute.
          </p>
        </div>
      </div>
    </main>
  );
}
