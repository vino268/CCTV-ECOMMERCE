'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { buildApiUrl } from '@/lib/http-response';

const PAGE_SIZE = 12;

export default function ProductsPage() {
  // Use same-origin relative paths for production
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').trim();
  const initialCategory = searchParams.get('category') ? decodeURIComponent(searchParams.get('category') || '') : 'All Categories';
  const [isMounted, setIsMounted] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [filteredProductsCount, setFilteredProductsCount] = useState(0);
  const fetchedPagesRef = useRef<Set<string>>(new Set());
  const lastQuerySignatureRef = useRef(`${searchTerm}|${initialCategory}`);
  const activeRequestKeyRef = useRef('');

  const fetchApi = async (path: string, init?: RequestInit) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(buildApiUrl(path), { cache: 'no-store', ...init });
        if (res.ok) return res;
      } catch {
        // retry once
      }
    }

    return null;
  };

  const fetchProducts = async () => {
    const requestKey = `${searchTerm}|${selectedCategory}|${page}`;
    if (fetchedPagesRef.current.has(requestKey)) return;

    activeRequestKeyRef.current = requestKey;

    if (page === 1) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setProductsError(null);

    try {
      const encodedSearch = encodeURIComponent(searchTerm);
      const encodedCategory = encodeURIComponent(selectedCategory);
      const categoryQuery = selectedCategory && selectedCategory !== 'All Categories' ? `&category=${encodedCategory}` : '';
      const res = await fetchApi(`/api/products?page=${page}&limit=${PAGE_SIZE}&search=${encodedSearch}${categoryQuery}`);

      if (!res) {
        if (page === 1) {
          setProducts([]);
          setProductsError('Products are temporarily unavailable');
        }
        setHasMore(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (activeRequestKeyRef.current !== requestKey) {
        return;
      }

      if (data?.success && Array.isArray(data?.products)) {
        const nextProducts = data.products;

        setFilteredProductsCount(Number(data?.filteredProductsCount ?? data?.total ?? nextProducts.length ?? 0));

        if (nextProducts.length === 0) {
          setHasMore(false);
          fetchedPagesRef.current.add(requestKey);
          return;
        }

        setProducts((prev) => {
          const existingIds = new Set(prev.map((product) => String(product._id)));
          const uniqueNextProducts = nextProducts.filter(
            (product: Product) => !existingIds.has(String(product._id))
          );
          return [...prev, ...uniqueNextProducts];
        });

        fetchedPagesRef.current.add(requestKey);

        const apiTotalPages = Number(data?.totalPages);
        if (Number.isFinite(apiTotalPages) && apiTotalPages > 0) {
          setHasMore(page < apiTotalPages);
        } else {
          setHasMore(nextProducts.length === PAGE_SIZE);
        }

      } else {
        if (activeRequestKeyRef.current !== requestKey) {
          return;
        }

        if (page === 1) {
          setProducts([]);
          setProductsError('Products are temporarily unavailable');
        }
        setFilteredProductsCount(0);
        setHasMore(false);
      }
    } catch {
      if (activeRequestKeyRef.current !== requestKey) {
        return;
      }

      if (page === 1) {
        setProducts([]);
        setProductsError('Products are temporarily unavailable');
      }
      setFilteredProductsCount(0);
      setHasMore(false);
    } finally {
      if (page === 1) {
        setIsInitialLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const querySignature = `${searchTerm}|${selectedCategory}`;

    if (lastQuerySignatureRef.current !== querySignature) {
      lastQuerySignatureRef.current = querySignature;
      fetchedPagesRef.current.clear();
      setProducts([]);
      setFilteredProductsCount(0);
      setHasMore(true);
      setProductsError(null);
      if (page !== 1) {
        setPage(1);
      }
      // Don't return - still call fetchProducts below
    }

    // Always call fetchProducts to load the data
    fetchProducts();
  }, [page, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadMore = () => {
    if (isInitialLoading || isLoadingMore || !hasMore) return;
    setPage((prev) => prev + 1);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetchApi('/api/categories/with-count', { method: 'GET' });

      if (!res) {
        setCategories([]);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (data?.success && Array.isArray(data?.categories)) {
        setCategories(data.categories);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    }
  };

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    const next =
      selectedCategory === "All Categories"
        ? products
        : products.filter((product) => {

            // CATEGORY NAME FROM PRODUCT
            const categoryName =
              typeof product.category === "object"
                ? (product.category as any)?.name
                : product.category;

            // NORMALIZE BOTH
            const productCat = String(categoryName)
              .toLowerCase()
              .trim();
            const selectedCat = String(selectedCategory)
              .toLowerCase()
              .trim();
            
            const matches = productCat === selectedCat;
            
            // Debug individual products
            if (!matches && process.env.NODE_ENV === 'development') {
              console.log(`❌ NO MATCH: "${productCat}" !== "${selectedCat}" | Product: ${product.name}`);
            }
            
            return matches;
          });

    if (sortBy === 'price-low') {
      return [...next].sort((a, b) => a.price - b.price);
    }

    if (sortBy === 'price-high') {
      return [...next].sort((a, b) => b.price - a.price);
    }

    return next;
  }, [products, selectedCategory, sortBy]);

  const visibleProducts = filteredProducts;

  // Get accurate category count for all products
  const getCategoryCount = (categoryName: string) => {
    if (categoryName === "All Categories") {
      return categories.reduce((sum, c) => sum + Number(c.productCount ?? c.count ?? 0), 0);
    }

    const catObj = categories.find((c: any) => {
      const name = typeof c === 'string' ? c : c.name;
      return name?.trim().toLowerCase() === categoryName?.trim().toLowerCase();
    });

    if (catObj) {
      return Number(catObj.productCount ?? catObj.count ?? 0);
    }

    return 0;
  };

  const getCategoryIcon = (category: string) => {
    const key = category.toLowerCase();

    if (key.includes('camera')) return Camera;
    if (key.includes('dvr') || key.includes('nvr') || key.includes('storage')) return HardDrive;
    if (key.includes('accessor') || key.includes('cable')) return Cable;
    if (key.includes('network')) return Network;
    if (key.includes('security') || key.includes('installation')) return ShieldCheck;

    return Tag;
  };

  const showEmptyState = !isInitialLoading && !productsError && visibleProducts.length === 0;

  const totalMatchingProducts = filteredProductsCount || visibleProducts.length;
  const isFiltered = selectedCategory !== 'All Categories' || Boolean(searchTerm);
  const productsCountLabel = isFiltered
    ? visibleProducts.length >= totalMatchingProducts
      ? `${totalMatchingProducts} products found`
      : `Showing ${visibleProducts.length} of ${totalMatchingProducts} products`
    : visibleProducts.length >= totalMatchingProducts
      ? `${totalMatchingProducts} products`
      : `Showing ${visibleProducts.length} of ${totalMatchingProducts} products`;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-gray-100 py-10 md:py-12">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-5 md:px-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Our Products
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Browse our complete selection of CCTV cameras and security equipment
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-5 md:px-6 md:py-12">
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Category */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">Categories</h3>
                <div className="mt-2 border-t border-gray-100" />

                <div className="mt-3 max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedCategory('All Categories')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      selectedCategory === 'All Categories'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-left">
                      <Tag className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">All Categories</span>
                    </span>
                    <span
                      className={`ml-3 text-xs font-semibold ${
                        selectedCategory === 'All Categories' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {getCategoryCount('All Categories')}
                    </span>
                  </button>

                  {categories.map((catObj: any) => {
                    const cat = typeof catObj === 'string' ? catObj : (catObj.name || catObj._id);
                    if (cat === 'All Categories') return null;
                    const Icon = getCategoryIcon(cat);
                    const count = getCategoryCount(cat);

                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setSelectedCategory(cat)
                        }
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
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
            <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <p className="text-sm text-gray-600">
                {productsCountLabel}
              </p>

              {isMounted ? (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground flex items-center">
                  Sort by
                </div>
              )}
            </div>

            {/* Grid */}
            {!showEmptyState && !productsError && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
                {visibleProducts.map((product: Product) => (
                  <div key={product._id} className="animate-[fadeIn_320ms_ease]">
                    <ProductCard product={product} />
                  </div>
                ))}

                {isInitialLoading &&
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <div
                      key={`product-skeleton-${index}`}
                      className="h-[360px] animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="h-48 w-full rounded-lg bg-gray-100" />
                      <div className="mt-4 h-4 w-4/5 rounded bg-gray-100" />
                      <div className="mt-2 h-4 w-2/5 rounded bg-gray-100" />
                      <div className="mt-5 h-9 w-full rounded-lg bg-gray-100" />
                    </div>
                  ))}
              </div>
            )}

              {productsError && !isInitialLoading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Failed to load products: {productsError}
                </div>
              )}

            {showEmptyState && (
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

            {!showEmptyState && (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 pb-8">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isInitialLoading || isLoadingMore}
                    className="inline-flex min-w-[160px] items-center justify-center rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </button>
                ) : (
                  !isInitialLoading && products.length > 0 && (
                    <p className="text-sm font-medium text-gray-500">No more products</p>
                  )
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}