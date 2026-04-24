'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function OrderSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId');

  useEffect(() => {
    if (orderId) {
      router.replace(`/order-success/${encodeURIComponent(orderId)}`);
    }
  }, [orderId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Order Placed Successfully
        </h1>

        <p className="text-gray-600 mb-2">
          Your order has been placed successfully.
        </p>

        <p className="font-semibold text-lg mb-6">
          {orderId ? `Redirecting to order ${orderId}...` : 'Order created.'}
        </p>

        <button
          onClick={() => router.push('/account/orders')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}
