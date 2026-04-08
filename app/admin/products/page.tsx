'use client';

import { useEffect, useRef, useState } from 'react';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, X, RefreshCw, Upload } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getSafeImageSrc } from '@/lib/product-image';

interface AddFormData {
  sku: string;
  name: string;
  price: string;
  category: string;
  description: string;
}

interface EditFormData {
  sku: string;
  name: string;
  price: string;
  category: string;
  description: string;
}

interface CategoryItem {
  _id: string;
  name: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryModalType, setCategoryModalType] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState<AddFormData>({
    sku: '',
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [addImages, setAddImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [isAddImageUploading, setIsAddImageUploading] = useState(false);
  const [addImageError, setAddImageError] = useState('');
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [skuError, setSkuError] = useState('');
  const [checkingSku, setCheckingSku] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    sku: '',
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [editInStock, setEditInStock] = useState(true);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [isEditImageUploading, setIsEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState('');
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | ''>('');
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/products`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchCategories() {
    try {
      const res = await fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();

      const nextCategories = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : [];

      console.log('Admin categories API response:', data);
      setCategories(nextCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const closeCategoryModal = () => {
    setCategoryModalType(null);
    setSelectedCategory(null);
    setCategoryName('');
  };

  const handleSubmitCategoryModal = async () => {
    if (!categoryModalType) return;

    const name = categoryName.trim();

    if ((categoryModalType === 'add' || categoryModalType === 'edit') && !name) {
      setCategoryError('Category name is required.');
      return;
    }

    if ((categoryModalType === 'edit' || categoryModalType === 'delete') && !selectedCategory) {
      setCategoryError('No category selected.');
      return;
    }

    if (categoryModalType === 'edit' && selectedCategory && name === selectedCategory.name) {
      closeCategoryModal();
      return;
    }

    try {
      setIsCategorySubmitting(true);
      setCategoryError('');

      let res: Response;

      if (categoryModalType === 'add') {
        res = await fetch(`${BASE_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      } else if (categoryModalType === 'edit') {
        res = await fetch(`${BASE_URL}/api/categories/${selectedCategory?._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      } else {
        res = await fetch(`${BASE_URL}/api/categories/${selectedCategory?._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.error || 'Failed to update category');
      }

      closeCategoryModal();
      await fetchCategories();
    } catch (err: any) {
      setCategoryError(err.message || 'Failed to update category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.has(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are allowed.');
    }

    if (file.size > maxSizeBytes) {
      throw new Error('Each image must be 5MB or less.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/api/products/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.imageUrl) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.imageUrl as string;
  };

  const generateSku = (category: string) => {
    if (!category) return '';

    const prefix = category
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();

    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${random}`;
  };

  useEffect(() => {
    if (!skuManuallyEdited && addFormData.category) {
      setAddFormData((prev) => ({
        ...prev,
        sku: generateSku(prev.category),
      }));
    }
  }, [addFormData.category, skuManuallyEdited]);

  const checkSkuExists = async (sku: string) => {
    const normalizedSku = sku.trim().toUpperCase();

    if (!normalizedSku) {
      setSkuError('');
      return;
    }

    try {
      setCheckingSku(true);

      const res = await fetch(`${BASE_URL}/api/products/check-sku?sku=${encodeURIComponent(normalizedSku)}`);
      const data = await res.json();

      if (data.exists) {
        setSkuError('SKU already exists');
      } else {
        setSkuError('');
      }
    } catch {
      setSkuError('Error checking SKU');
    } finally {
      setCheckingSku(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (addFormData.sku.trim()) {
        checkSkuExists(addFormData.sku);
      } else {
        setSkuError('');
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [addFormData.sku]);

  const handleAddImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    try {
      setIsAddImageUploading(true);
      setAddImageError('');

      const uploadedUrls = await Promise.all(validFiles.map((file) => uploadImageFile(file)));
      setAddImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setAddImageError(err.message || 'Failed to upload one or more images.');
    } finally {
      setIsAddImageUploading(false);
    }
  };

  const removeAddImage = (index: number) => {
    setAddImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !addFormData.sku.trim() ||
      !addFormData.name.trim() ||
      !addFormData.price.trim() ||
      !addFormData.category.trim() ||
      !addFormData.description.trim()
    ) {
      return;
    }

    if (checkingSku || skuError || isAddImageUploading) {
      return;
    }

    const payload = {
      sku: addFormData.sku.trim(),
      name: addFormData.name.trim(),
      price: Number(addFormData.price),
      category: addFormData.category,
      description: addFormData.description.trim(),
      images: addImages,
      image: addImages[0] || '',
      inStock: true,
    };

    try {
      setIsAddSubmitting(true);
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add product');
      }

      await fetchProducts();
      setAddFormData({
        sku: '',
        name: '',
        price: '',
        category: '',
        description: '',
      });
      setSkuManuallyEdited(false);
      setSkuError('');
      setAddImageError('');
      setAddImages([]);
      if (addFileRef.current) addFileRef.current.value = '';
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding product:', err);
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditFormData({
      sku: product.sku || '',
      name: product.name,
      price: String(product.price),
      category: product.category,
      description: product.description || '',
    });
    setEditInStock(product.inStock);
    const mainImage = getSafeImageSrc(product.image || product.images?.[0], '');
    setEditImagePreview(mainImage);
    setEditImageError('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const id = editProduct._id;

    if (!editFormData.sku.trim() || !editFormData.name.trim() || !editFormData.category.trim()) {
      return;
    }

    const imageList = editImagePreview ? [editImagePreview] : [];

    try {
      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: editFormData.sku,
          name: editFormData.name,
          price: parseFloat(editFormData.price),
          category: editFormData.category,
          description: editFormData.description,
          images: imageList,
          image: imageList[0] || '',
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

  const confirmDelete = async () => {
    if (!deleteItem || deleteType !== 'product') return;

    const id = deleteItem._id;

    try {
      setIsDeleteSubmitting(true);
      const res = await fetch(`${BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteItem(null);
        setDeleteType('');
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const ImageInput = ({
    preview,
    setPreview,
    fileRef,
  }: {
    preview: string;
    setPreview: (v: string) => void;
    fileRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">Product Image</label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
            setIsEditImageUploading(true);
            setEditImageError('');
            const uploadedUrl = await uploadImageFile(file);
            setPreview(uploadedUrl);
          } catch (err: any) {
            setEditImageError(err.message || 'Failed to upload image.');
          } finally {
            setIsEditImageUploading(false);
          }
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />

      {isEditImageUploading && <p className="mt-2 text-xs text-muted-foreground">Uploading image...</p>}
      {editImageError && <p className="mt-2 text-xs text-red-600">{editImageError}</p>}

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory ({products.length} items)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchProducts} className="gap-2 w-full sm:w-auto">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setShowAddModal(true);
              setSkuManuallyEdited(false);
              setSkuError('');
              setAddImageError('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="p-5 border border-border">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-3">
          <h2 className="text-base font-semibold">Category Management</h2>
          <Button
            type="button"
            onClick={() => {
              setCategoryModalType('add');
              setSelectedCategory(null);
              setCategoryName('');
              setCategoryError('');
            }}
            className="w-full sm:w-auto"
          >
            Add Category
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:shadow-md transition"
            >
              <h3 className="text-gray-800 font-medium text-sm break-words md:text-base">{cat.name}</h3>
              <div className="flex gap-2 md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 md:flex-none border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
                  onClick={() => {
                    setCategoryModalType('edit');
                    setSelectedCategory(cat);
                    setCategoryName(cat.name);
                    setCategoryError('');
                  }}
                  disabled={isCategorySubmitting}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  className="flex-1 md:flex-none bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
                  onClick={() => {
                    setCategoryModalType('delete');
                    setSelectedCategory(cat);
                    setCategoryName('');
                    setCategoryError('');
                  }}
                  disabled={isCategorySubmitting}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
        {categoryError && <p className="mt-2 text-xs text-red-600">{categoryError}</p>}
      </Card>

      <Card className="border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No products found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Image</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="p-4 text-center text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = product._id;
                  return (
                    <tr key={id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        {product.image ? (
                          <img
                            src={getSafeImageSrc(product.image, '/products/default.jpg')}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-foreground whitespace-nowrap">{product.name}</td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">{product.category}</td>
                      <td className="p-4 font-medium text-foreground whitespace-nowrap">{formatPrice(product.price)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
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
                            onClick={() => {
                              setDeleteItem(product);
                              setDeleteType('product');
                            }}
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
          </div>
        )}
      </Card>

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Edit Product</h2>
              <button
                onClick={() => setEditProduct(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">SKU *</label>
                <input
                  type="text"
                  value={editFormData.sku}
                  onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Stock Status</label>
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
                preview={editImagePreview}
                setPreview={setEditImagePreview}
                fileRef={editFileRef}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit">Update Product</Button>
                <Button type="button" variant="outline" onClick={() => setEditProduct(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-3">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto animate-modal">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-6">Add New Product</h2>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-4">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addFormData.sku}
                          onChange={(e) => {
                            setSkuManuallyEdited(true);
                            setAddFormData({
                              ...addFormData,
                              sku: e.target.value.toUpperCase(),
                            });
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                            skuError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder="Auto-generated or edit manually"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSkuManuallyEdited(false);
                            if (!addFormData.category) {
                              setAddFormData((prev) => ({ ...prev, sku: '' }));
                              setSkuError('');
                              return;
                            }
                            setAddFormData((prev) => ({
                              ...prev,
                              sku: generateSku(prev.category),
                            }));
                          }}
                        >
                          Auto
                        </Button>
                      </div>

                      {checkingSku && <p className="text-xs text-gray-500 mt-1">Checking SKU...</p>}

                      {skuError && <p className="text-xs text-red-500 mt-1">{skuError}</p>}

                      {!skuError && addFormData.sku && !checkingSku && (
                        <p className="text-xs text-green-600 mt-1">SKU available</p>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Product Name"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      className="input"
                      required
                    />

                    <div>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={addFormData.price}
                        onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                        className="input"
                        required
                      />
                      {Number(addFormData.price) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Preview: {formatPrice(Number(addFormData.price))}
                        </p>
                      )}
                    </div>

                    <select
                      value={addFormData.category}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAddFormData({
                          ...addFormData,
                          category: value,
                        });
                      }}
                      className="input"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-4">Description</h3>
                  <textarea
                    rows={4}
                    placeholder="Enter product description"
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-4">Images</h3>

                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleAddImageFiles(e.dataTransfer.files);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      ref={addFileRef}
                      onChange={(e) => handleAddImageFiles(e.target.files)}
                    />

                    <p className="text-gray-600 mb-3">Drag & drop CCTV images here</p>
                    <p className="text-gray-500 text-sm mb-4">📷 Upload CCTV product images (JPG, PNG)</p>

                    <button
                      type="button"
                      onClick={() => addFileRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Upload Images
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    External image URLs are blocked. Upload files only.
                  </p>

                  {isAddImageUploading && (
                    <p className="text-xs text-gray-500 mt-2">Uploading image files...</p>
                  )}

                  {addImageError && <p className="text-xs text-red-500 mt-2">{addImageError}</p>}

                  {addImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {addImages.map((img, i) => (
                      <div key={`${img}-${i}`} className="relative group">
                        <img
                          src={getSafeImageSrc(img, '/products/default.jpg')}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-28 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeAddImage(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-4">Actions</h3>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      disabled={isAddSubmitting || checkingSku || !!skuError || isAddImageUploading}
                    >
                      {isAddSubmitting ? 'Saving...' : 'Save Product'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                      disabled={isAddSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {categoryModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4">
              {categoryModalType === 'add' && 'Add Category'}
              {categoryModalType === 'edit' && 'Edit Category'}
              {categoryModalType === 'delete' && 'Delete Category'}
            </h2>

            {(categoryModalType === 'add' || categoryModalType === 'edit') && (
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (categoryError) setCategoryError('');
                }}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name"
              />
            )}

            {categoryModalType === 'delete' && (
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold">"{selectedCategory?.name}"</span>?
              </p>
            )}

            {categoryError && <p className="mt-3 text-xs text-red-600">{categoryError}</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeCategoryModal}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                disabled={isCategorySubmitting}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitCategoryModal}
                className={`px-4 py-2 rounded-lg text-white ${
                  categoryModalType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isCategorySubmitting}
              >
                {isCategorySubmitting
                  ? categoryModalType === 'delete'
                    ? 'Deleting...'
                    : 'Saving...'
                  : categoryModalType === 'delete'
                    ? 'Delete'
                    : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteItem && deleteType === 'product'}
        message={`Are you sure you want to delete this product${deleteItem?.name ? ` (${deleteItem.name})` : ''}? This action cannot be undone.`}
        isDeleting={isDeleteSubmitting}
        onCancel={() => {
          setDeleteItem(null);
          setDeleteType('');
        }}
        onConfirm={confirmDelete}
      />

      <style jsx global>{`
        .animate-modal {
          animation: fadeIn 0.3s ease;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }

        .input {
          width: 100%;
          border: 1px solid #ccc;
          padding: 8px;
          border-radius: 8px;
          background: #fff;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
