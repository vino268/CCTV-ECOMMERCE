'use client';

import { useState, useEffect, useRef } from 'react';
import { products } from '@/lib/data';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, Upload, X } from 'lucide-react';

export default function AdminProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load admin products from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_products');
    if (stored) {
      setAdminProducts(JSON.parse(stored));
    }
  }, []);

  const allProducts = [...products, ...adminProducts];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '' });
    setImagePreview('');
    setImageUrl('');
    setImageSource('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description || '',
      rating: 0,
      reviews: 0,
      image: imagePreview,
      specs: {},
      inStock: true,
    };

    const updated = [...adminProducts, newProduct];
    setAdminProducts(updated);
    localStorage.setItem('admin_products', JSON.stringify(updated));

    resetForm();
    setShowForm(false);
  };

  const handleDeleteAdminProduct = (id: string) => {
    const updated = adminProducts.filter((p) => p.id !== id);
    setAdminProducts(updated);
    localStorage.setItem('admin_products', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Add New Product
          </h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Dome Cameras"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter product description"
              />
            </div>

            {/* Image Section */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Product Image
              </label>

              {/* Toggle between upload and URL */}
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={imageSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSource('upload')}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={imageSource === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSource('url')}
                >
                  Paste URL
                </Button>
              </div>

              {imageSource === 'upload' ? (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
              ) : (
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                />
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Product</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Products Table */}
      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Image
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Product Name
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Category
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Price
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Rating
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Stock
                </th>
                <th className="text-center px-6 py-4 font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((product) => {
                const isAdmin = adminProducts.some((p) => p.id === product.id);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded flex items-center justify-center text-lg border border-border">
                          📷
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {product.rating} ★
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.inStock
                            ? 'bg-green-500/20 text-green-700'
                            : 'bg-red-500/20 text-red-700'
                        }`}
                      >
                        {product.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 hover:bg-muted rounded transition-colors text-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAdminProduct(product.id)}
                            className="p-2 hover:bg-muted rounded transition-colors text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!isAdmin && (
                          <button className="p-2 hover:bg-muted rounded transition-colors text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
