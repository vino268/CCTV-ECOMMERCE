'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_ROWS = [
  { key: 'ordered', label: 'Ordered', color: '#3b82f6' },
  { key: 'processing', label: 'Processing', color: '#f59e0b' },
  { key: 'shipped', label: 'Shipped', color: '#8b5cf6' },
  { key: 'delivered', label: 'Delivered', color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
] as const;

type StatusKey = (typeof STATUS_ROWS)[number]['key'];

interface OrdersStatusData {
  ordered: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  pending?: number;
}

interface OrdersStatusChartProps {
  data: OrdersStatusData;
  loading: boolean;
  subtitle?: string;
}

export default function OrdersStatusChart({
  data,
  loading,
  subtitle = 'Orders by status',
}: OrdersStatusChartProps) {
  const chartData = STATUS_ROWS.map((row) => ({
    id: row.key,
    name: row.label,
    value: Number(data[row.key] || 0),
    color: row.color,
  }));

  const total =
    Number(data.ordered || data.pending || 0) +
    Number(data.processing || 0) +
    Number(data.shipped || 0) +
    Number(data.delivered || 0) +
    Number(data.cancelled || 0);

  const hasData = total > 0;

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
        <div className="h-[300px] animate-pulse space-y-3">
          <div className="h-4 w-2/5 rounded bg-gray-100" />
          <div className="h-[240px] rounded-xl bg-gray-100" />
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
              barCategoryGap={22}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.14)' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number) => {
                  const count = Number(value || 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return [`${count} (${pct.toFixed(0)}%)`, 'Orders'];
                }}
              />
              <Bar
                dataKey="value"
                radius={[10, 10, 0, 0]}
                maxBarSize={52}
                animationDuration={900}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.id}-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
