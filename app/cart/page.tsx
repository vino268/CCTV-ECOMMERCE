'use client';

import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const router = useRouter();

  const cartTotal = getCartTotal();
  const shippingCost = cartTotal > 100 ? 0 : 9.99;
  const tax = cartTotal * 0.08;
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
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-6 py-4 font-semibold">
                        Product
                      </th>
                      <th className="text-center px-6 py-4 font-semibold">
                        Price
                      </th>
                      <th className="text-center px-6 py-4 font-semibold">
                        Quantity
                      </th>
                      <th className="text-right px-6 py-4 font-semibold">
                        Total
                      </th>
                      <th className="text-center px-6 py-4 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 via-muted to-accent/10 rounded-xl flex items-center justify-center text-2xl">
                              📷
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {item.product?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {item.productId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          ${item.product?.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex border border-border rounded-lg w-24 mx-auto">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              className="px-3 py-1 hover:bg-muted transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.productId,
                                  Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  )
                                )
                              }
                              className="w-12 text-center py-1 border-l border-r border-border focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              className="px-3 py-1 hover:bg-muted transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          $
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-muted/30 flex justify-between items-center">
                <Link href="/products">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="text-destructive"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/60 rounded-2xl p-6 sticky top-20 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-primary font-semibold">Free</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              {cartTotal < 100 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground">
                  Add ${(100 - cartTotal).toFixed(2)} more for free shipping!
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
