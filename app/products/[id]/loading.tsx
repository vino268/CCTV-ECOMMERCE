import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Skeleton className="h-5 w-64 rounded-xl" />
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="h-[520px] rounded-3xl" />
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}