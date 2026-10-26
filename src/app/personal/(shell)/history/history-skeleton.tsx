import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `page.tsx`: the weekly curve hero card, the 2×2 stat-pill grid,
 * the all-time stats list, then recent sessions. */
export function HistorySkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <Skeleton className="h-8 w-48" radius="var(--radius-sm)" />
      <div className="h-6" />

      <Skeleton className="h-[280px] w-full" radius="var(--radius-xl)" />

      <div className="h-4" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[90px] w-full" radius="44px" />
        ))}
      </div>

      <div className="h-8" />
      <Skeleton className="h-3 w-16" radius="var(--radius-sm)" />
      <div className="h-4" />
      <Skeleton className="h-10 w-32" radius="var(--radius-sm)" />
      <div className="h-1.5" />
      <Skeleton className="h-4 w-24" radius="var(--radius-sm)" />
      <div className="h-6" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <Skeleton className="h-3.5 w-28" radius="var(--radius-sm)" />
          <Skeleton className="h-3.5 w-10" radius="var(--radius-sm)" />
        </div>
      ))}

      <div className="h-8" />
      <Skeleton className="h-3 w-32" radius="var(--radius-sm)" />
      <div className="h-2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-[22px] w-[22px] shrink-0" radius="999px" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/3" radius="var(--radius-sm)" />
            <div className="h-1.5" />
            <Skeleton className="h-3 w-1/3" radius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </main>
  );
}
