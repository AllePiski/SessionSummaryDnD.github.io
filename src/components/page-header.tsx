import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-bold tracking-wide text-balance md:text-3xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="grid gap-4" aria-busy>
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}
