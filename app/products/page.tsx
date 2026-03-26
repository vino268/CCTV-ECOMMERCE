'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, HardDrive, Cable, Network, ShieldCheck, Tag } from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').trim();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('featured');

  // Load products from MongoDB API
  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`);
      const data = await res.json();
      setProducts(data);
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();

      setCategories([
        'All Categories',
        ...data.map((cat: any) => cat.name),
      ]);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  // Initialize category filter from URL
  useEffect(() => {
    const categoryParam = searchParams.get('category');

    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    } else {
      setSelectedCategory('All Categories');
    }
  }, [searchParams]);

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    const categoryFiltered =
      selectedCategory === 'All Categories'
        ? products
        : products.filter((p) => p.category === selectedCategory);

    let filtered = [...categoryFiltered];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, selectedCategory, sortBy, searchTerm]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) || 0) + 1);
    }
    return counts;
  }, [products]);

  const getCategoryIcon = (category: string) => {
    const key = category.toLowerCase();

    if (key.includes('camera')) return Camera;
    if (key.includes('dvr') || key.includes('nvr') || key.includes('storage')) return HardDrive;
    if (key.includes('accessor') || key.includes('cable')) return Cable;
    if (key.includes('network')) return Network;
    if (key.includes('security') || key.includes('installation')) return ShieldCheck;

    return Tag;
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-gray-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
            Our Products
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Browse our complete selection of CCTV cameras and security equipment
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">

              {/* Category */}
              <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                <div className="mt-3 border-t border-gray-100" />

                <div className="mt-4 max-h-[360px] overflow-y-auto pr-1 space-y-2">
                  {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat);
                    const count = cat === 'All Categories' ? products.length : categoryCounts.get(cat) || 0;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-left">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">{cat}</span>
                        </span>
                        <span
                          className={`ml-3 text-xs font-semibold ${
                            selectedCategory === cat ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(selectedCategory !== 'All Categories' || searchTerm) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory('All Categories');
                    router.push('/products');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">

            {/* Sort */}
            <div className="flex justify-between items-center mb-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} products
              </p>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low → High</SelectItem>
                  <SelectItem value="price-high">Price: High → Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No products found matching your criteria.
                </p>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('All Categories');
                    router.push('/products');
                  }}
                >
                  View All Products
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}