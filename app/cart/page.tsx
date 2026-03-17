'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatINRCurrency } from '@/lib/currency';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const router = useRouter();
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    async function fetchTaxRate() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) {
          setTaxRate(0);
          return;
        }

        const settings = await res.json();
        const parsedTaxRate = Number(settings?.taxPercentage);
        setTaxRate(Number.isFinite(parsedTaxRate) ? parsedTaxRate : 0);
      } catch (err) {
        console.error('Error loading tax settings:', err);
        setTaxRate(0);
      }
    }

    fetchTaxRate();
  }, []);

  const cartTotal = getCartTotal();
  const shippingCost = cartTotal > 100 ? 0 : 9.99;
  const tax = (cartTotal * taxRate) / 100;
  const total = cartTotal + shippingCost + tax;

  // Cart items already contain product data from the cart context
  const cartItems = cart;

  if (cart.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Empty Cart State */}
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-4xl">
                🛒
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You haven't added any items to your cart yet. Start shopping now to
              secure your property!
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2">
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
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="hidden md:grid md:grid-cols-5 gap-4 border-b border-border bg-muted/50 px-6 py-4 text-sm font-semibold text-foreground">
                <div>Product</div>
                <div className="text-center">Price</div>
                <div className="text-center">Quantity</div>
                <div className="text-right">Total</div>
                <div className="text-center">Action</div>
              </div>

              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-1 gap-4 px-4 py-5 transition-colors hover:bg-muted/20 md:grid-cols-5 md:items-center md:px-6"
                  >
                    <div className="md:col-span-1">
                      <Link href={`/products/${item.productId}`} className="flex items-start gap-4 min-w-[260px]">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gradient-to-br from-primary/10 to-secondary/10">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-cover hover:opacity-80 transition"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              📷
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium text-gray-900 whitespace-normal hover:text-blue-600">
                            {item.product?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.productId}
                          </p>
                        </div>
                      </Link>
                    </div>

                    <div className="md:text-center">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                        Price
                      </p>
                      <p className="font-medium text-foreground">
                        {formatINRCurrency(item.product?.price || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                        Quantity
                      </p>
                      <div className="mt-1 flex w-full max-w-[10rem] items-center overflow-hidden rounded-lg border border-border md:mx-auto md:mt-0">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="flex-1 px-3 py-2 transition-colors hover:bg-muted"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-14 border-x border-border py-2 text-center focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="flex-1 px-3 py-2 transition-colors hover:bg-muted"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                        Total
                      </p>
                      <p className="font-semibold text-foreground">
                        {formatINRCurrency((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                        Action
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 px-4 py-2 text-destructive transition-colors hover:bg-destructive/10 md:mt-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 bg-muted/30 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                <Link href="/products">
                  <Button variant="outline" className="w-full gap-2 md:w-auto">
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="w-full text-destructive md:w-auto"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-20 space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINRCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-primary font-semibold">Free</span>
                    ) : (
                      formatINRCurrency(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatINRCurrency(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatINRCurrency(total)}</span>
              </div>

              {cartTotal < 100 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground">
                  Add {formatINRCurrency(100 - cartTotal)} more for free shipping!
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  const user = localStorage.getItem('user');
                  if (user) {
                    router.push('/checkout');
                  } else {
                    localStorage.setItem('redirectAfterLogin', '/checkout');
                    router.push('/account');
                  }
                }}
              >
                Proceed to Checkout
              </Button>

              <Link href="/products">
                <Button variant="outline" className="w-full">
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
