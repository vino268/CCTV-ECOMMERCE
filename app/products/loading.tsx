import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <Skeleton className="h-12 w-56 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-4">
          <Skeleton className="h-[360px] rounded-2xl lg:col-span-1" />
          <div className="lg:col-span-3 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="h-[360px] rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}