export interface Product {
  _id?: string;
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  specs: {
    [key: string]: string;
  };
  description: string;
  inStock: boolean;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  price?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  deliveryInfo: {
    address: string;
    city: string;
    zipCode: string;
    phone: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  savedAddresses?: {
    address: string;
    city: string;
    zipCode: string;
    isDefault: boolean;
  }[];
  createdAt: string;
}
