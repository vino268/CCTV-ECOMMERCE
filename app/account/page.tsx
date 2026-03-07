'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Package, MapPin } from 'lucide-react';

interface OrderItem {
  productId: string;
  quantity: number;
  productName: string;
  productPrice: number;
}

interface StoredOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  deliveryInfo: {
    address: string;
    city: string;
    zipCode: string;
    phone: string;
  };
}

export default function AccountPage() {

  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  const [user, setUser] = useState({
    name: '',
    email: '',
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoggedIn(true);
      setActiveTab("dashboard");
      loadOrders(parsedUser.email);
    }
  }, []);

  const loadOrders = (email: string) => {
    const allOrders: StoredOrder[] = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = allOrders.filter((o) => o.customerId === email);
    setOrders(userOrders);
  };

  const handleRedirectAfterLogin = () => {
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirect);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Admin login
    if (
      loginForm.email === "admin@gmail.com" &&
      loginForm.password === "admin123"
    ) {
      router.push("/admin");
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.email === loginForm.email) {
        setUser(parsedUser);
        setIsLoggedIn(true);
        setActiveTab("dashboard");
        loadOrders(parsedUser.email);
        handleRedirectAfterLogin();
      }
    }

    setLoginForm({ email: "", password: "" });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      signupForm.name &&
      signupForm.email &&
      signupForm.password === signupForm.confirmPassword
    ) {

      const newUser = {
        name: signupForm.name,
        email: signupForm.email,
      };

      localStorage.setItem("user", JSON.stringify(newUser));

      setUser(newUser);
      setIsLoggedIn(true);
      setActiveTab("dashboard");

      setSignupForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      handleRedirectAfterLogin();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setOrders([]);
    setActiveTab("login");
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">My Account</h1>
            <p className="text-muted-foreground">
              Login or create account
            </p>
          </div>

          <div className="bg-card border rounded-lg">

            <Tabs defaultValue="login">

              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN */}

              <TabsContent value="login" className="p-8">

                <form onSubmit={handleLogin} className="space-y-4">

                  <input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <Button type="submit" className="w-full">
                    Login
                  </Button>

                </form>

              </TabsContent>

              {/* SIGNUP */}

              <TabsContent value="signup" className="p-8">

                <form onSubmit={handleSignup} className="space-y-4">

                  <input
                    type="text"
                    placeholder="Full Name"
                    value={signupForm.name}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, name: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, password: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={signupForm.confirmPassword}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>

                </form>

              </TabsContent>

            </Tabs>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">

      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="flex justify-between mb-8">

          <h1 className="text-3xl font-bold">My Account</h1>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 text-red-500"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>

        </div>

        <Tabs defaultValue="dashboard">

          <TabsList className="grid grid-cols-3 mb-8">

            <TabsTrigger value="dashboard">
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>

            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>

            <TabsTrigger value="addresses">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>

          </TabsList>

          {/* DASHBOARD */}

          <TabsContent value="dashboard">

            <div className="grid md:grid-cols-3 gap-6 mb-8">

              <div className="border rounded-lg p-6">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-lg">{user.name}</p>
              </div>

              <div className="border rounded-lg p-6">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold text-lg">{user.email}</p>
              </div>

              <div className="border rounded-lg p-6">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="font-semibold text-lg">{orders.length}</p>
              </div>

            </div>

          </TabsContent>

          {/* ORDERS */}

          <TabsContent value="orders">

            {orders.length === 0 ? (
              <div className="border rounded-lg p-8 text-center">
                <Package className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No orders yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-6 bg-card"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-foreground text-lg">
                          Order {order.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold capitalize">
                          {order.status}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.productName} x{item.quantity}
                          </span>
                          <span className="font-semibold">
                            ${(item.productPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </TabsContent>

          {/* ADDRESS */}

          <TabsContent value="addresses">

            <div className="border rounded-lg p-8 text-center">

              <MapPin className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />

              <p className="text-muted-foreground">
                No address added
              </p>

            </div>

          </TabsContent>

        </Tabs>

      </div>

    </div>
  );
}
