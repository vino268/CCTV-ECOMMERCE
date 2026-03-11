'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Order {
  orderStatus: string;
}

interface Props {
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  Shipped: '#8b5cf6',
  Delivered: '#22c55e',
  Cancelled: '#ef4444',
};

export function OrderStatusChart({ orders }: Props) {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    const s = o.orderStatus || 'Unknown';
    counts[s] = (counts[s] || 0) + 1;
  }

  const data = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center items-center h-full min-h-[280px]">
        <p className="text-sm text-gray-400">No order data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        Orders by Status
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        All time distribution
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: 12,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / .07)',
            }}
            formatter={(v: number) => [v, 'Orders']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] || '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: STATUS_COLORS[entry.status] || '#94a3b8' }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {entry.status} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
