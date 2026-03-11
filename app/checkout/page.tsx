'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ShippingSettings = {
  freeShippingThreshold: number;
  standardShippingCost: number;
};

type PaymentSettings = {
  cashOnDelivery: boolean;
  upi: boolean;
  onlinePayment: boolean;
};

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();
  type CheckoutStep = 'info' | 'payment' | 'complete';
  const [step, setStep] = useState<CheckoutStep>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 0,
    standardShippingCost: 0,
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cashOnDelivery: true,
    upi: true,
    onlinePayment: true,
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Get first available payment method
  const getFirstAvailablePaymentMethod = (settings: PaymentSettings): string => {
    if (settings.cashOnDelivery) return 'cod';
    if (settings.upi) return 'upi';
    if (settings.onlinePayment) return 'online';
    return 'cod'; // Fallback
  };

  // Auth guard + auto-fill from user profile
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      localStorage.setItem('redirectAfterLogin', '/checkout');
      router.push('/account');
      return;
    }

    const user = JSON.parse(stored);
    const nameParts = (user.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
      address: prev.address || user.address || '',
    }));
  }, [router]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch tax rate and shipping settings
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        
        // Fetch tax rate
        const gst = Number(data?.taxSettings?.gstPercentage || 0);
        if (Number.isFinite(gst) && gst >= 0) {
          setTaxRate(gst);
        }
        
        // Fetch shipping settings
        const freeShippingThreshold = Number(data?.shippingSettings?.freeShippingThreshold || 0);
        const standardShippingCost = Number(data?.shippingSettings?.standardShippingCost || 0);
        setShippingSettings({
          freeShippingThreshold: Number.isFinite(freeShippingThreshold) ? freeShippingThreshold : 0,
          standardShippingCost: Number.isFinite(standardShippingCost) ? standardShippingCost : 0,
        });

        // Fetch payment settings
        const paymentRes = await fetch('/api/settings/payment', { cache: 'no-store' });
        if (!paymentRes.ok) return;
        const paymentData = await paymentRes.json();
        setPaymentSettings(paymentData);
        
        // Auto-select first available payment method
        const firstMethod = getFirstAvailablePaymentMethod(paymentData);
        setPaymentMethod(firstMethod);
      } catch (_error) {
        // Keep default settings if API is unavailable
        // Set default payment method as fallback
        setPaymentMethod('cod');
      }
    };

    fetchSettings();
  }, []);

  const cartTotal = getCartTotal();
  
  // Simple shipping logic: if order total >= threshold, free shipping, else standard cost
  const deliveryCharge = cartTotal >= shippingSettings.freeShippingThreshold 
    ? 0 
    : shippingSettings.standardShippingCost;
  
  const shippingCost = deliveryCharge;
  const tax = (cartTotal + shippingCost) * (taxRate / 100);
  const total = cartTotal + shippingCost + tax;

  // Cart items already contain product data from the cart context
  const cartItems = cart;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getFullAddress = () =>
    [formData.address, formData.city, formData.state, formData.zipCode]
      .filter(Boolean)
      .join(', ');

  const handleContinueToPayment = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      alert('Please fill in all fields');
      return;
    }

    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    const newOrderNumber =
      '#TN' + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: newOrderNumber,
          userId: stored._id || '',
          customerName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          products: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.product?.name || '',
            productPrice: item.product?.price || 0,
            quantity: item.quantity,
          })),
          totalAmount: parseFloat(total.toFixed(2)),
          deliveryCharge: Number(deliveryCharge || 0),
          paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod === 'upi' ? 'UPI' : 'Online',
          paymentStatus: paymentMethod === 'cod' ? 'Unpaid' : 'Paid',
          orderStatus: 'Pending',
          deliveryInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zipCode,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save order');

      setOrderNumber(newOrderNumber);
      clearCart();
      setStep('complete');
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Something went wrong while placing your order. Please try again.');
    } finally {
      setIsProcessing(false);
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
                    {formData.firstName} {formData.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-semibold">{formData.email}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Total Amount:</span>{' '}
                  <span className="font-semibold">${total.toFixed(2)}</span>
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

  if (cart.length === 0 && step !== 'complete') {
    return (
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

  // Check if no payment methods are enabled
  const noPaymentMethodsAvailable = !paymentSettings.cashOnDelivery && !paymentSettings.upi && !paymentSettings.onlinePayment;
  
  if (noPaymentMethodsAvailable && step === 'payment') {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Checkout Unavailable
            </h1>
            <p className="text-muted-foreground mb-8">
              We're currently updating our payment options. Please check back later.
            </p>
            <Link href="/cart">
              <Button>Back to Cart</Button>
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
        <Link href="/cart">
          <Button variant="outline" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Delivery Information */}
            {step === 'info' && (
              <div className="bg-card border border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Delivery Information
                </h2>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+1 (615) 555-1234"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nashville"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="TN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="37201"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleContinueToPayment}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Payment
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <div className="bg-card border border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Payment Method
                </h2>
                <div className="space-y-4 mb-8">
                  {paymentSettings.cashOnDelivery && (
                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          Cash on Delivery
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pay when your order arrives
                        </p>
                      </div>
                    </label>
                  )}

                  {paymentSettings.upi && (
                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          UPI Payment
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Google Pay, PhonePe, Paytm, or other UPI apps
                        </p>
                      </div>
                    </label>
                  )}

                  {paymentSettings.onlinePayment && (
                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          Online Payment
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Credit/Debit Card or Digital Wallet
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-20">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-border max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
