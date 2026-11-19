"use client";

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="learnova-card p-5 space-y-3">
          <div className="h-3 w-24 rounded-md bg-[var(--surface-subtle)]" />
          <div className="h-7 w-16 rounded-lg bg-[var(--surface-subtle)]" />
          <div className="h-3 w-32 rounded-md bg-[var(--surface-subtle)]" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ rows, lines }: { rows?: number; lines?: number }) {
  const count = rows ?? lines ?? 3;
  return (
    <div className="learnova-card p-6 space-y-4 animate-pulse">
      <div className="h-4 w-44 rounded-md bg-[var(--surface-subtle)]" />
      <div className="space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border)]" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <KpiGridSkeleton />
      <div className="grid lg:grid-cols-2 gap-6">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
