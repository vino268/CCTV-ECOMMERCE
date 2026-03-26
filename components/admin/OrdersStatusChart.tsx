'use client';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

interface StatusData {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  Ordered: '#2563eb',
  Shipped: '#7c3aed',
  Delivered: '#22c55e',
  Cancelled: '#ef4444',
};

interface OrdersStatusChartProps {
  data: StatusData[];
  loading: boolean;
  subtitle?: string;
}

export default function OrdersStatusChart({
  data,
  loading,
  subtitle = 'Orders by status',
}: OrdersStatusChartProps) {

  const normalizedData = useMemo(() => {
    const acc = new Map<string, number>();

    data.forEach((entry) => {
      const status = (entry.status || 'Ordered').trim();
      const count = Number(entry.count) || 0;
      acc.set(status, (acc.get(status) || 0) + count);
    });

    return Array.from(acc.entries()).map(([status, count]) => ({ status, count }));
  }, [data]);

  const total = normalizedData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Orders by Status</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {!loading && (
          <p className="text-2xl font-bold text-foreground mt-1">
            {total} orders
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[250px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : normalizedData.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {normalizedData.map((entry, index) => {
              const max = Math.max(...normalizedData.map((item) => item.count), 1);
              const percent = Math.max(0, Math.min(100, (entry.count / max) * 100));

              return (
                <div key={`${entry.status}-row-${index}`}>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{entry.status}</span>
                    <span>{entry.count} orders</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: STATUS_COLORS[entry.status] || '#6b7280',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {normalizedData.map((entry, index) => (
              <div key={`${entry.status}-legend-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: STATUS_COLORS[entry.status] || '#6b7280' }}
                />
                {entry.status} ({entry.count})
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
