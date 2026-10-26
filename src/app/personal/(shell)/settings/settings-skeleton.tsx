import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `page.tsx`: the Account section (two rows), then About (one
 * row) — the lightest of the three tabs, rows only, no hero card. */
export function SettingsSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <Skeleton className="h-8 w-32" radius="var(--radius-sm)" />
      <div className="h-6" />

      <Skeleton className="h-3 w-20" radius="var(--radius-sm)" />
      <div className="h-2" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-[22px] w-[22px] shrink-0" radius="999px" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3" radius="var(--radius-sm)" />
            <div className="h-1.5" />
            <Skeleton className="h-3 w-3/4" radius="var(--radius-sm)" />
          </div>
        </div>
      ))}

      <div className="h-8" />
      <Skeleton className="h-3 w-16" radius="var(--radius-sm)" />
      <div className="h-2" />
      <div className="flex items-center gap-4 py-3">
        <Skeleton className="h-[22px] w-[22px] shrink-0" radius="999px" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/4" radius="var(--radius-sm)" />
          <div className="h-1.5" />
          <Skeleton className="h-3 w-full" radius="var(--radius-sm)" />
        </div>
      </div>
    </main>
  );
}
