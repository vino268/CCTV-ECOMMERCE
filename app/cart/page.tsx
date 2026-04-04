'use client';

import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/contexts/auth-context';
import { getSafeImageSrc } from '@/lib/product-image';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const cartTotal = getCartTotal();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartItems = cart;

  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Empty Cart State */}
          <div className="text-center py-20 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl">
                🛒
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Cart is empty
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't added any items to your cart yet. Start shopping now to
              secure your property!
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Shopping Cart
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => {
              const price = item.product?.price || 0;
              const subtotal = price * item.quantity;
              const productImage = getSafeImageSrc(item.product?.image, '/products/default.jpg');

              return (
                <div
                  key={item.productId}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-5 md:p-6"
                >
                  <div className="grid md:grid-cols-[112px_1fr] gap-4 md:gap-6">
                    <div className="w-28 h-28 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.product?.name || 'Product image'}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl">📷</span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-500">SKU: {item.productId}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Price</p>
                          <p className="text-base font-semibold text-gray-900">
                            {formatPrice(price)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Quantity</p>
                          <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                              className="w-10 h-10 hover:bg-gray-100 transition-colors"
                            >
                              −
                            </button>
                            <div className="w-12 h-10 border-l border-r border-gray-200 flex items-center justify-center text-sm font-semibold">
                              {item.quantity}
                            </div>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-10 h-10 hover:bg-gray-100 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Subtotal</p>
                          <p className="text-lg font-bold text-blue-700 tracking-tight">
                            {formatPrice(subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Link href="/products" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto gap-2 rounded-xl border-blue-600 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => clearCart()}
                className="w-full sm:w-auto rounded-xl text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-xl p-6 sticky top-20 space-y-5 shadow-md">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Total Items</span>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Price</span>
                  <span className="font-semibold text-gray-900">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-700">Free Shipping</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-extrabold tracking-tight text-gray-900">
                <span>Total</span>
                <span className="text-blue-700">{formatPrice(cartTotal)}</span>
              </div>

              <Button
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={cartItems.length === 0}
                onClick={() => {
                  console.log('Proceed to Checkout click', {
                    cartItemsCount: cartItems.length,
                    isAuthenticated,
                  });
                  if (isAuthenticated) {
                    router.push('/checkout');
                  } else {
                    router.push('/login?redirect=/checkout');
                  }
                }}
              >
                Proceed to Checkout
              </Button>

              <Link href="/products">
                <Button variant="outline" className="w-full rounded-xl border-blue-600 text-blue-700 hover:bg-blue-50">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
