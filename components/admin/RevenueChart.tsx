'use client';

import {
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatINRCurrency } from '@/lib/currency';

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  loading: boolean;
  subtitle?: string;
}

export default function RevenueChart({
  data,
  loading,
  subtitle = 'Revenue trend',
}: RevenueChartProps) {
  const total = data.reduce((sum, d) => sum + Number(d.revenue || 0), 0);

  const normalized = data.map((point) => {
    return {
      ...point,
      shortDate: String(point.date || ''),
    };
  });

  const hasData = normalized.some((item) => Number(item.revenue || 0) > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Revenue</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {!loading && (
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatINRCurrency(total)}
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-[260px] animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-[200px] rounded-xl bg-gray-100" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`revenue-skeleton-${i}`} className="h-3 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ) : normalized.length === 0 || !hasData ? (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No revenue data in selected range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={normalized} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number) => [formatINRCurrency(Number(value || 0)), 'Revenue']}
              labelFormatter={(_label, payload) => {
                const point = Array.isArray(payload) && payload.length > 0 ? payload[0]?.payload : null;
                return point?.date || '';
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revenueGradient)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              isAnimationActive
              animationDuration={900}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
