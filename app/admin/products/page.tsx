'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, X, RefreshCw, Upload, Link } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [addImageSource, setAddImageSource] = useState<'upload' | 'url'>('upload');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addImagePreview, setAddImagePreview] = useState('');
  const [addInStock, setAddInStock] = useState(true);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [editInStock, setEditInStock] = useState(true);
  const [editImageSource, setEditImageSource] = useState<'upload' | 'url'>('upload');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch Products                                                  */
  /* ---------------------------------------------------------------- */

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Image helpers                                                   */
  /* ---------------------------------------------------------------- */

  const handleFileRead = (
    file: File,
    setPreview: (v: string) => void,
    setUrl: (v: string) => void
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setUrl('');
    };
    reader.readAsDataURL(file);
  };

  /* ---------------------------------------------------------------- */
  /*  Add Product                                                     */
  /* ---------------------------------------------------------------- */

  const resetAddForm = () => {
    setAddFormData({ name: '', price: '', category: '', description: '' });
    setAddImagePreview('');
    setAddImageUrl('');
    setAddImageSource('upload');
    setAddInStock(true);
    if (addFileRef.current) addFileRef.current.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.price || !addFormData.category) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addFormData.name,
          price: parseFloat(addFormData.price),
          category: addFormData.category,
          description: addFormData.description,
          image: addImagePreview,
          rating: 0,
          reviews: 0,
          inStock: addInStock,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        resetAddForm();
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Update Product                                                  */
  /* ---------------------------------------------------------------- */

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditFormData({
      name: product.name,
      price: String(product.price),
      category: product.category,
      description: product.description || '',
    });
    setEditInStock(product.inStock);
    setEditImagePreview(product.image || '');
    setEditImageUrl(product.image || '');
    setEditImageSource('url');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    const id = editProduct._id || editProduct.id;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          price: parseFloat(editFormData.price),
          category: editFormData.category,
          description: editFormData.description,
          image: editImagePreview,
          inStock: editInStock,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        setEditProduct(null);
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Delete Product                                                  */
  /* ---------------------------------------------------------------- */

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Shared image input component                                    */
  /* ---------------------------------------------------------------- */

  const ImageInput = ({
    source,
    setSource,
    url,
    setUrl,
    preview,
    setPreview,
    fileRef,
  }: {
    source: 'upload' | 'url';
    setSource: (val: 'upload' | 'url') => void;
    url: string;
    setUrl: (val: string) => void;
    preview: string;
    setPreview: (val: string) => void;
    fileRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Product Image</label>
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            size="sm"
            variant={source === 'upload' ? 'default' : 'outline'}
            onClick={() => setSource('upload')}
            className="gap-1"
          >
            <Upload className="w-3 h-3" /> Upload
          </Button>
          <Button
            type="button"
            size="sm"
            variant={source === 'url' ? 'default' : 'outline'}
            onClick={() => setSource('url')}
            className="gap-1"
          >
            <Link className="w-3 h-3" /> URL
          </Button>
        </div>
        {source === 'upload' ? (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileRead(file, setPreview, setUrl);
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        ) : (
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreview(e.target.value);
            }}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
        {preview && (
          <div className="mt-3 relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-md border border-border"
            />
            <button
              type="button"
              onClick={() => {
                setPreview('');
                setUrl('');
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your product inventory &middot; {products.length} items
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="outline" onClick={fetchProducts} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={() => {
              resetAddForm();
              setShowAddForm(!showAddForm);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* ===== Add Product Form ===== */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Add New Product</h2>

          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hikvision 2MP Dome Camera"
                  value={addFormData.name}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, name: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addFormData.price}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, price: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category *
              </label>
              <input
                type="text"
                placeholder="e.g. Dome Cameras"
                value={addFormData.category}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, category: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                placeholder="Product description..."
                value={addFormData.description}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <ImageInput
              source={addImageSource}
              setSource={setAddImageSource}
              url={addImageUrl}
              setUrl={setAddImageUrl}
              preview={addImagePreview}
              setPreview={setAddImagePreview}
              fileRef={addFileRef}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Stock Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="addInStock"
                    checked={addInStock}
                    onChange={() => setAddInStock(true)}
                    className="accent-primary"
                  />
                  In Stock
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="addInStock"
                    checked={!addInStock}
                    onChange={() => setAddInStock(false)}
                    className="accent-primary"
                  />
                  Out of Stock
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Save Product</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAddForm();
                  setShowAddForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Products Table ===== */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
            <p className="text-sm text-gray-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No products found. Add your first product above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = product._id || product.id;
                  return (
                    <tr
                      key={id}
                      className="border-b border-gray-50 last:border-b-0 transition-colors duration-150 hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-3.5">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                        {product.category}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                        ₹{product.price}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            product.inStock
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(product)}
                            className="gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Edit Modal ===== */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Edit Product
              </h2>
              <button
                onClick={() => setEditProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Stock Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="inStock"
                      checked={editInStock}
                      onChange={() => setEditInStock(true)}
                      className="accent-primary"
                    />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="inStock"
                      checked={!editInStock}
                      onChange={() => setEditInStock(false)}
                      className="accent-primary"
                    />
                    Out of Stock
                  </label>
                </div>
              </div>

              <ImageInput
                source={editImageSource}
                setSource={setEditImageSource}
                url={editImageUrl}
                setUrl={setEditImageUrl}
                preview={editImagePreview}
                setPreview={setEditImagePreview}
                fileRef={editFileRef}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit">Update Product</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProduct(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
