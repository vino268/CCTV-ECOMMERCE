'use client';

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface RevenueData {
  label: string;
  amount: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  total: number;
  range: string;
  loading?: boolean;
}

export default function RevenueChart({
  data,
  total,
  range,
  loading = false,
}: RevenueChartProps) {
  const hasData = data.length > 0 && data.some((item) => Number(item.amount || 0) > 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
        <span className="text-sm text-gray-500">{range}</span>
      </div>

      {loading ? (
        <div className="animate-pulse mb-4 h-10 w-32 rounded bg-gray-100" />
      ) : (
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          ₹{Number(total || 0).toLocaleString('en-IN')}
        </h2>
      )}

      {loading ? (
        <div className="h-[220px] rounded-xl bg-gray-100 animate-pulse" />
      ) : !hasData ? (
        <p className="text-gray-400 text-center py-10">
          No revenue data available
        </p>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value: number) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Revenue']}
                labelStyle={{ color: '#111827' }}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 3, fill: '#22c55e' }}
                activeDot={{ r: 6, fill: '#16a34a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
