import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `page.tsx`'s own layout: today's stat card, the duration-picker
 * chips + Start button, then recent sessions. */
export function FocusSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <div className="flex items-center pb-6">
        <Skeleton className="h-4 w-20" radius="var(--radius-sm)" />
      </div>

      <Skeleton className="h-[148px] w-full" radius="var(--radius-xl)" />

      <div className="h-8" />
      <Skeleton className="h-3 w-28" radius="var(--radius-sm)" />
      <div className="h-2" />
      <div className="flex flex-wrap gap-2">
        {[64, 64, 64, 64, 80].map((w, i) => (
          <Skeleton key={i} className="h-[41px]" radius="999px" style={{ width: w }} />
        ))}
      </div>
      <div className="h-6" />
      <Skeleton className="h-14 w-full" radius="999px" />

      <div className="mt-10 flex items-center justify-between">
        <Skeleton className="h-4 w-32" radius="var(--radius-sm)" />
        <Skeleton className="h-4 w-14" radius="var(--radius-sm)" />
      </div>
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
