'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { getSafeImageSrc } from '@/lib/product-image';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

interface BuyNowOrderState {
  createdOrderId?: string;
  productId: string;
  customOrderId?: string;
  orderNumber?: string;
  quantity: number;
  product: {
    name?: string;
    image?: string;
    price?: number;
    inStock?: boolean;
  };
  deliveryDetails?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  type CheckoutStep = 'checkout' | 'complete';
  const [step, setStep] = useState<CheckoutStep>('checkout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const placingOrderRef = useRef(false);
  const prefilledUserKeyRef = useRef('');
  const [orderNumber, setOrderNumber] = useState('');
  const [buyNowOrder, setBuyNowOrder] = useState<BuyNowOrderState | null>(null);
  const [isLoadingBuyNow, setIsLoadingBuyNow] = useState(false);
  const { showError, showSuccess } = useToast();
  const buyNowOrderId = searchParams.get('orderId');
  const buyNowProductId = String(searchParams.get('productId') || '').trim();
  const isBuyNowFlow = Boolean(buyNowProductId || buyNowOrderId);
  const isBuyNowProductFlow = Boolean(buyNowProductId);

  // If the URL indicates a buy-now product flow but no productId is present,
  // show a friendly message instead of a blank page.
  if (isBuyNowProductFlow && !buyNowProductId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No product selected</h2>
          <p className="text-sm text-muted-foreground">Please go back and select a product to checkout.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      console.log('Checkout auth redirect', {
        cartItemsCount: cart.length,
        hasUser: Boolean(user),
      });
      const redirectPath = isBuyNowProductFlow && buyNowProductId
        ? `/checkout?productId=${buyNowProductId}`
        : isBuyNowFlow && buyNowOrderId
          ? `/checkout?orderId=${buyNowOrderId}`
          : '/checkout';
      router.push(`/login?redirect=${redirectPath}`);
      return;
    }

    const userKey = String(user?._id || user?.email || '').trim().toLowerCase();
    if (userKey && prefilledUserKeyRef.current === userKey) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
      address: prev.address || user.address || '',
    }));

    if (userKey) {
      prefilledUserKeyRef.current = userKey;
    }
  }, [router, authLoading, isAuthenticated, user?._id, user?.email, user?.name, user?.phone, user?.address, isBuyNowFlow, isBuyNowProductFlow, buyNowOrderId, buyNowProductId]);

  useEffect(() => {
    if (!isBuyNowFlow) {
      setBuyNowOrder(null);
      setIsLoadingBuyNow(false);
      return;
    }

    if (authLoading || !isAuthenticated) return;

    let cancelled = false;

    const fetchBuyNowOrder = async () => {
      try {
        setIsLoadingBuyNow(true);

        if (isBuyNowProductFlow && buyNowProductId) {
          const productRes = await fetch(buildApiUrl(`/api/products/${encodeURIComponent(buyNowProductId)}`), {
            cache: 'no-store',
            credentials: 'include',
          });

          const productData = await parseResponseBody<any>(productRes);
          if (cancelled) return;

          if (!productRes.ok || !productData?.product) {
            showError(productData?.message || 'Unable to load buy now item');
            setBuyNowOrder(null);
            return;
          }

          setBuyNowOrder({
            productId: String(productData.product?._id || buyNowProductId).trim(),
            quantity: 1,
            product: {
              name: String(productData.product?.name || 'Product').trim(),
              image: String(productData.product?.image || '').trim(),
              price: Number(productData.product?.price || 0),
              inStock: Boolean(productData.product?.inStock),
            },
          });
          return;
        }

        if (!buyNowOrderId) {
          setBuyNowOrder(null);
          return;
        }

        const uid = user?._id ? `&userId=${encodeURIComponent(user._id)}` : '';
        const res = await fetch(buildApiUrl(`/api/orders/buy-now?orderId=${encodeURIComponent(buyNowOrderId)}${uid}`), {
          cache: 'no-store',
          credentials: 'include',
        });

        const data = await parseResponseBody<any>(res);
        if (cancelled) return;

        if (!res.ok) {
          showError(data?.message || 'Unable to load buy now item');
          setBuyNowOrder(null);
          return;
        }

        setBuyNowOrder(data.order || null);
      } catch {
        if (!cancelled) {
          showError('Unable to load buy now item');
          setBuyNowOrder(null);
        }
      } finally {
        if (!cancelled) setIsLoadingBuyNow(false);
      }
    };

    fetchBuyNowOrder();

    return () => {
      cancelled = true;
    };
  }, [isBuyNowFlow, isBuyNowProductFlow, buyNowProductId, buyNowOrderId, authLoading, isAuthenticated, showError, user?._id]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD' | null>(null);
  const paymentFinalizedRef = useRef(false);
  const razorpayOrderIdRef = useRef('');

  const checkoutItems = isBuyNowFlow
    ? buyNowOrder
      ? [{
          productId: buyNowOrder.productId,
          quantity: buyNowOrder.quantity,
          product: buyNowOrder.product,
        }]
      : []
    : cart;

  const subtotal = checkoutItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = 0;
  const total = subtotal;

  // Checkout items can come from cart or a buy-now single item session
  const cartItems = checkoutItems;

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && (window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateCheckoutForm = () => {
    if (!paymentMethod) {
      showError('Please select a payment method');
      return false;
    }

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      showError('Please fill in all fields');
      return false;
    }
    return true;
  };

  const createOrderPayload = (method: 'Online' | 'COD', paymentResponse?: any, paymentStatusOverride?: 'Paid' | 'Failed' | 'Pending') => {
    const normalizedProducts = cartItems.map((item) => ({
      productId: String(item.productId || '').trim(),
      productName: String(item.product?.name || '').trim(),
      productImage: String(item.product?.image || '').trim(),
      productPrice: Number(item.product?.price || 0),
      quantity: Number(item.quantity || 1),
    }));

    const primaryProduct = normalizedProducts[0];

    return {
      productId: String(primaryProduct?.productId || buyNowOrder?.productId || buyNowProductId || '').trim(),
      quantity: Number(primaryProduct?.quantity || buyNowOrder?.quantity || 1),
      totalAmount: Number(total),
      paymentMethod: method === 'COD' ? 'COD' : 'Online',
      paymentStatus: paymentStatusOverride || (method === 'COD' ? 'Pending' : 'Paid'),
      orderStatus: 'Ordered',
      ...(paymentResponse
        ? {
            razorpayOrderId: paymentResponse.razorpay_order_id || razorpayOrderIdRef.current,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          }
        : razorpayOrderIdRef.current
          ? { razorpayOrderId: razorpayOrderIdRef.current }
          : {}),
      products: normalizedProducts,
      items: normalizedProducts.map((item) => ({
        name: item.productName,
        price: item.productPrice,
        quantity: item.quantity,
        image: item.productImage,
      })),
      address: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
    };
  };

  const persistOrder = async (method: 'Online' | 'COD', paymentResponse?: any, paymentStatusOverride?: 'Paid' | 'Failed' | 'Pending') => {
    const orderPayload = createOrderPayload(method, paymentResponse, paymentStatusOverride);

    const saveResponse = await fetch(buildApiUrl('/api/orders'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const savedOrder = await parseResponseBody<any>(saveResponse);
    return { saveResponse, savedOrder };
  };

  const saveOrderAndRedirect = async (method: 'Online' | 'COD', paymentResponse?: any) => {
    const paymentStatus = method === 'COD' ? 'Pending' : 'Paid';
    const { saveResponse, savedOrder } = await persistOrder(method, paymentResponse, paymentStatus);

    if (!saveResponse.ok || !savedOrder?.success) {
      throw new Error(savedOrder?.message || 'Failed to save order');
    }

    const createdOrderId = String(savedOrder?.order?._id || savedOrder?.order?.orderId || '').trim();
    if (!isBuyNowFlow) {
      clearCart();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orders-changed'));
    }

    showSuccess(method === 'COD' ? 'COD Order Placed Successfully' : 'Payment successful');
    router.push(createdOrderId ? `/order-success?orderId=${encodeURIComponent(createdOrderId)}` : '/account/orders');
  };

  const finalizeFailedPayment = async (status: 'Failed' | 'Pending', message: string) => {
    if (paymentFinalizedRef.current) return;
    paymentFinalizedRef.current = true;

    try {
      await persistOrder('Online', undefined, status);
    } catch (error) {
      console.error('ORDER SAVE ERROR:', error);
    } finally {
      showError(message);
      setIsProcessing(false);
      placingOrderRef.current = false;
    }
  };

  const handleSaveAddress = async () => {
    if (!validateCheckoutForm()) return;
    if (!user?._id) {
      showError('Please login to save address');
      return;
    }

    setIsSavingAddress(true);
    try {
      const res = await fetch(buildApiUrl('/api/address/add'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }),
      });

      const payload = await parseResponseBody<any>(res);
      if (!res.ok) {
        throw new Error(payload.message || payload.error || 'Failed to save address');
      }

      showSuccess('Address saved successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (method: 'Online' | 'COD' = paymentMethod || 'Online') => {
    if (placingOrderRef.current || isProcessing) return;
    if (!validateCheckoutForm()) return;
    if (cartItems.length === 0) return;

    placingOrderRef.current = true;
    setIsProcessing(true);
    setPaymentMethod(method);
    paymentFinalizedRef.current = false;
    razorpayOrderIdRef.current = '';

    try {
      if (method === 'COD') {
        await saveOrderAndRedirect('COD');
        return;
      }

      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const response = await fetch(buildApiUrl('/api/payment/create-order'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: total }),
      });

      const data = await parseResponseBody<any>(response);
      const razorpayOrder = data?.order || data;

      if (!response.ok || !razorpayOrder?.id) {
        throw new Error(data?.message || data?.error || 'Failed to create Razorpay order');
      }

      razorpayOrderIdRef.current = String(razorpayOrder.id || '').trim();

      const paymentOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'TN AUTOMATION',
        description: 'Product Payment',
        order_id: razorpayOrder.id,
        handler: async (paymentResponse: any) => {
          if (paymentFinalizedRef.current) return;
          paymentFinalizedRef.current = true;

          try {
            await saveOrderAndRedirect('Online', paymentResponse);
          } catch (saveError: any) {
            console.error('ORDER SAVE ERROR:', saveError);
            showError(saveError?.message || 'Payment succeeded but order save failed');
            paymentFinalizedRef.current = false;
            setIsProcessing(false);
            placingOrderRef.current = false;
          } finally {
            setIsProcessing(false);
            placingOrderRef.current = false;
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            void finalizeFailedPayment('Pending', 'Payment cancelled');
          },
        },
      };

      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay checkout is unavailable');
      }

      const paymentObject = new RazorpayConstructor(paymentOptions);
      paymentObject.on('payment.failed', (event: any) => {
        const failureMessage =
          event?.error?.description ||
          event?.error?.reason ||
          event?.error?.source ||
          event?.error?.code ||
          'Payment failed';

        void finalizeFailedPayment('Failed', failureMessage);
      });
      paymentObject.open();
    } catch (error: any) {
      console.error('PAYMENT ERROR:', error);
      showError(error?.message || 'Payment failed');
      setIsProcessing(false);
      placingOrderRef.current = false;
    }
  };

  if (step === 'complete') {
          return (
            <div className="bg-background min-h-screen">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center py-16 max-w-2xl mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-4xl">
                      <Check className="w-10 h-10" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Order Confirmed!
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your order. We've received your payment and will
                    start processing your order right away.
                  </p>
                  <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
                    <h2 className="font-semibold text-foreground mb-4">
                      Order Details
                    </h2>
                    <div className="space-y-2 text-sm mb-4">
                      <p>
                        <span className="text-muted-foreground">Order Number:</span>{' '}
                        <span className="font-semibold">
                          {orderNumber}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Customer:</span>{' '}
                        <span className="font-semibold">
                          {formData.fullName}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        <span className="font-semibold">{formData.email}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total Amount:</span>{' '}
                        <span className="font-semibold">{formatPrice(total)}</span>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A confirmation email has been sent to {formData.email}
                    </p>
                  </div>
                  <Link href="/products">
                    <Button size="lg">Continue Shopping</Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        }
  if (authLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking session...</p>
      </div>
    );
  }

if (!isBuyNowFlow && cart.length === 0) {    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Your cart is empty
            </h1>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isBuyNowFlow && isLoadingBuyNow) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading buy now item...</p>
      </div>
    );
  }

  if (isBuyNowFlow && !isLoadingBuyNow && cartItems.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Buy now session expired
            </h1>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <Link href={isBuyNowFlow ? '/products' : '/cart'}>
          <Button variant="outline" className="mb-6 gap-2 rounded-xl border-slate-300 bg-white">
            <ArrowLeft className="w-4 h-4" />
            {isBuyNowFlow ? 'Back to Products' : 'Back to Cart'}
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        </div>

        <div className="checkout-container">
          {/* Left: Delivery Form */}
          <div className="checkout-left border border-slate-200 sm:p-6 lg:p-7">
              <div className="mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="section-title text-slate-900">Delivery Address</h2>
              </div>

              <div className="delivery-form space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number *</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email *</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Address *</label>
                  <div className="relative">
                    <Home className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="House no, street, area"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveAddress}
                    variant="outline"
                    className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 sm:w-auto"
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Address'
                    )}
                  </Button>
                </div>
              </div>
          </div>

          {/* Right: Sticky Order Summary */}
          <div className="checkout-right order-summary border border-slate-200 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                <h2 className="section-title mb-0 text-slate-900">
                Order Summary
                </h2>
              </div>

              <div className="mb-5 max-h-72 space-y-3 overflow-y-auto border-b border-slate-200 pb-5">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <img
                        src={getSafeImageSrc(item.product?.image, '/products/default.jpg')}
                        alt={item.product?.name || 'Product image'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-slate-900">{item.product?.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-5 space-y-2 border-b border-slate-200 pb-5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>
              </div>

              <div className="mb-4 flex justify-between text-xl font-bold text-slate-900">
                <span>Total</span>
                <span className="total-price">{formatPrice(total)}</span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <Truck className="h-3.5 w-3.5" />
                Estimated Delivery: 3-5 days
              </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">Payment Method</p>
                <div className="space-y-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                      paymentMethod === 'Online'
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online"
                      checked={paymentMethod === 'Online'}
                      onChange={() => setPaymentMethod('Online')}
                      className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Online Payment (Razorpay)</span>
                      <span className="block text-xs text-slate-500">Pay now using Razorpay checkout.</span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                      paymentMethod === 'COD'
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Cash on Delivery</span>
                      <span className="block text-xs text-slate-500">Pay when your order is delivered.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => handlePlaceOrder('Online')}
                  disabled={isProcessing || cartItems.length === 0 || paymentMethod !== 'Online'}
                  size="lg"
                  className="place-order-btn"
                >
                  {isProcessing && paymentMethod === 'Online' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay with Razorpay'
                  )}
                </Button>

                <Button
                  onClick={() => handlePlaceOrder('COD')}
                  disabled={isProcessing || cartItems.length === 0 || paymentMethod !== 'COD'}
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                >
                  {isProcessing && paymentMethod === 'COD' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place COD Order'
                  )}
                </Button>
              </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
