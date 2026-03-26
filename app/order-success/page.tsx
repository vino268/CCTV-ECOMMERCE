'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '';

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Order Placed Successfully</h1>
          <p className="text-muted-foreground mb-6">
            Your order has been created and is being processed.
          </p>

          {orderNumber ? (
            <p className="text-sm text-muted-foreground mb-8">
              Order Number: <span className="font-semibold text-foreground">{orderNumber}</span>
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders">
              <Button>View My Orders</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
