'use client';

        <div className="bg-white rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Address</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className="transition-colors duration-150 hover:bg-blue-50/30"
                  >
                    <td className="px-5 py-3.5 text-gray-400">{index + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{customer.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{customer.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{customer.address || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 bg-gray-50/40 text-xs text-gray-400 border-t border-gray-100">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </div>
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage customer information</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500"
          />
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, phone, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm text-gray-400">Loading customers…</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-lg text-gray-400 mb-4">👥</p>
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            {search ? 'No Results Found' : 'No Customers Yet'}
          </h2>
          <p className="text-sm text-gray-400">
            {search
              ? `No customers matched "${search}". Try a different search.`
              : 'Registered users will appear here automatically.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && customers.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Address</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className="transition-colors duration-150 hover:bg-blue-50/30"
                  >
                    <td className="px-5 py-3.5 text-gray-400">{index + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{customer.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{customer.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{customer.address || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 bg-gray-50/40 text-xs text-gray-400 border-t border-gray-100">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
