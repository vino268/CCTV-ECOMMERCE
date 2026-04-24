'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

export default function OrderSuccessByIdPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderCode, setOrderCode] = useState('');

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(buildApiUrl(`/api/orders/${id}`), {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await parseResponseBody(res);

        if (!res.ok) {
          throw new Error(data?.error || 'Unable to load order details');
        }

        if (!active) return;
        setOrderCode(String(data?.orderId || data?.orderNumber || id || ''));
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Unable to load order details');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-green-600">Order Placed Successfully</h1>

        {loading ? (
          <p className="mb-6 text-gray-600">Loading order details...</p>
        ) : error ? (
          <p className="mb-6 text-red-600">{error}</p>
        ) : (
          <>
            <p className="mb-2 text-gray-600">Your order has been placed successfully.</p>
            <p className="mb-6 text-lg font-semibold">Order ID: {orderCode}</p>
          </>
        )}

        <button
          type="button"
          onClick={() => router.push('/account/orders')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}
