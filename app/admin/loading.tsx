import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Skeleton className="h-12 w-56 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}