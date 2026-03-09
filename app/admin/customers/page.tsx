'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce: wait 350 ms after the user stops typing before fetching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/customers?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage customer information</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name, email, phone, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <Card className="p-12 border border-border text-center">
          <p className="text-muted-foreground">Loading customers…</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <Card className="p-12 border border-border text-center">
          <p className="text-lg text-muted-foreground mb-4">👥</p>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {search ? 'No Results Found' : 'No Customers Yet'}
          </h2>
          <p className="text-muted-foreground">
            {search
              ? `No customers matched "${search}". Try a different search.`
              : 'Registered users will appear here automatically.'}
          </p>
        </Card>
      )}

      {/* Table */}
      {!loading && customers.length > 0 && (
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{customer.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.address || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t border-border">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </div>
        </Card>
      )}
    </div>
  );
}
