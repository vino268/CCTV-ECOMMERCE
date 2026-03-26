'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
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

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

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
        <div className="flex items-center justify-center h-[250px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
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
              formatter={(value: number) => [formatINRCurrency(value), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
