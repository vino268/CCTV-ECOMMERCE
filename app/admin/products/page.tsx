'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, X, RefreshCw, Upload } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import ProductDeleteConfirmModal from '@/components/admin/ProductDeleteConfirmModal';
import ToastNotification from '@/components/ui/toast-notification';
import { getSafeImageSrc } from '@/lib/product-image';
import { getAdminAuthHeaders } from '@/lib/admin-auth';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/lib/http-response';
import imageCompression from 'browser-image-compression';

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

export default function AdminProductsPage() {
  const router = useRouter();
  const { toast, showError, showSuccess } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
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
  const [addImages, setAddImages] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [addImageUrl, setAddImageUrl] = useState('');
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
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditImageUploading, setIsEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState('');
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | ''>('');
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await fetch(buildApiUrl(`/api/admin/products?page=${page}&limit=10`), {
        method: 'GET',
        cache: 'no-store',
        next: { revalidate: 0 },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json().catch(() => ({}));
      const nextProducts = Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(nextProducts);
      const resolvedTotalPages = Number.isFinite(Number(data?.totalPages))
        ? Math.max(1, Number(data.totalPages))
        : 1;
      setTotalPages(resolvedTotalPages);
      setTotalProducts(Number.isFinite(Number(data?.total)) ? Number(data.total) : nextProducts.length);

      if (page > resolvedTotalPages) {
        setCurrentPage(resolvedTotalPages);
      }
    } catch (error) {
      console.error('Fetch Products Error:', error);
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  async function fetchCategories() {
    try {
      const res = await fetch(buildApiUrl('/api/categories'), { cache: 'no-store', credentials: 'include' });
      const data = await res.json().catch(() => ({}));

      console.log('Admin categories:', data);

      if (data.success) {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Admin category fetch error:', err);
      setCategories([]);
    }
  }

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
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
    const isAdd = categoryModalType === 'add';
    const isEdit = categoryModalType === 'edit';
    const isDelete = categoryModalType === 'delete';

    if ((isAdd || isEdit) && !name) {
      setCategoryError('Category name is required.');
      return;
    }

    if ((isEdit || isDelete) && !selectedCategory) {
      setCategoryError('No category selected.');
      return;
    }

    if (isEdit && selectedCategory && name === selectedCategory.name) {
      closeCategoryModal();
      return;
    }

    try {
      setIsCategorySubmitting(true);
      setCategoryError('');

      const method = isAdd ? 'POST' : isEdit ? 'PUT' : 'DELETE';
      const url = isAdd 
        ? buildApiUrl('/api/admin/categories') 
        : buildApiUrl(`/api/admin/categories/${selectedCategory?._id}`);

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: isDelete ? undefined : JSON.stringify({ name }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fallbackError = isEdit 
          ? 'Failed to update category' 
          : isAdd 
            ? 'Failed to create category' 
            : 'Failed to delete category';
        throw new Error(payload.message || payload.error || fallbackError);
      }

      closeCategoryModal();
      await fetchCategories();
    } catch (err: any) {
      setCategoryError(err.message || (isEdit ? 'Failed to update category' : 'Failed to create category'));
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      const base64 = await toBase64(file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Upload Error Details:", data);
        throw new Error(data.error || "Upload failed");
      }

      return data.url;
    } catch (error) {
      console.error("toBase64 or Fetch Error:", error);
      throw error;
    }
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

      const res = await fetch(buildApiUrl(`/api/products/check-sku?sku=${encodeURIComponent(normalizedSku)}`), {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

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

      const merged = [...addImages, ...validFiles].slice(0, 5);
      setAddImages(merged);
      setAddImagePreviews(merged.map((file) => URL.createObjectURL(file)));
      console.log(merged);
    } catch (err: any) {
      setAddImageError(err.message || 'Failed to upload one or more images.');
    } finally {
      setIsAddImageUploading(false);
    }
  };

  const removeAddImage = (index: number) => {
    setAddImages((prev) => prev.filter((_, i) => i !== index));
    setAddImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

    try {
      setIsAddSubmitting(true);
      const trimmedImageUrl = addImageUrl.trim();
      if (trimmedImageUrl && !/^https?:\/\//i.test(trimmedImageUrl)) {
        throw new Error('Invalid image URL. It must start with http or https.');
      }

      const uploadedImageUrls = addImages.length > 0
        ? await Promise.all(addImages.map((file) => uploadImageFile(file)))
        : [];

      const finalImage = uploadedImageUrls[0] || trimmedImageUrl;
      const finalImages = uploadedImageUrls.length > 0
        ? uploadedImageUrls
        : trimmedImageUrl
          ? [trimmedImageUrl]
          : [];

      const res = await fetch(buildApiUrl('/api/products'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: addFormData.sku.trim(),
          name: addFormData.name.trim(),
          price: Number(addFormData.price),
          category: addFormData.category,
          description: addFormData.description.trim(),
          inStock: true,
          images: finalImages,
          image: finalImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add product');
      }

      setCurrentPage(1);
      await fetchProducts(1);
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
      setAddImagePreviews([]);
      setAddImageUrl('');
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
    const imageList = Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((image) => getSafeImageSrc(image, '')).filter(Boolean)
      : [];
    const fallbackImage = getSafeImageSrc(product.image, '');
    setEditImages(imageList.length > 0 ? imageList : fallbackImage ? [fallbackImage] : []);
    setEditImageError('');
  };

  const handleEditImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    try {
      setIsEditImageUploading(true);
      setEditImageError('');

      const uploadedUrls = await Promise.all(validFiles.map((file) => uploadImageFile(file)));
      setEditImages((prev) => Array.from(new Set([...prev, ...uploadedUrls])).slice(0, 5));
    } catch (err: any) {
      setEditImageError(err.message || 'Failed to upload image(s).');
    } finally {
      setIsEditImageUploading(false);
    }
  };

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const id = editProduct._id;

    if (!editFormData.sku.trim() || !editFormData.name.trim() || !editFormData.category.trim()) {
      return;
    }

    const imageList = editImages.length > 0 ? editImages : [];

    try {
      const res = await fetch(buildApiUrl(`/api/products/${id}`), {
        method: 'PUT',
        credentials: 'include',
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
        router.refresh();
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || deleteType !== 'product') return;

    const id = deleteItem._id;

    if (!id) {
      console.error('Delete product error: missing MongoDB _id', deleteItem);
      showError('Unable to delete product: missing product id');
      return;
    }

    try {
      setIsDeleteSubmitting(true);
      console.log('Deleting product id:', id);

      const res = await fetch(buildApiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      console.log('Delete product API response:', data);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((product) => product._id !== id));

      const remainingCount = Math.max(0, totalProducts - 1);
      const nextTotalPages = Math.max(1, Math.ceil(remainingCount / 10));
      setTotalProducts(remainingCount);
      setTotalPages(nextTotalPages);
      if (currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
      }

      setDeleteItem(null);
      setDeleteType('');
      showSuccess(data?.message || 'Product deleted successfully');
      await fetchProducts(currentPage);
      router.refresh();
    } catch (err) {
      console.error('Delete product error:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleEditImageFiles(e.target.files)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />

                {isEditImageUploading && (
                  <p className="mt-2 text-xs text-muted-foreground">Uploading image(s)...</p>
                )}
                {editImageError && <p className="mt-2 text-xs text-red-600">{editImageError}</p>}

                {editImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {editImages.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        <img src={img} alt={`Edit preview ${index + 1}`} className="w-full h-full object-cover" />

                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory ({totalProducts} items)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => fetchProducts(currentPage)} className="gap-2 w-full sm:w-auto">
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

        {!loading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  currentPage === pageNumber
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleEditImageFiles(e.target.files)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />

                {isEditImageUploading && (
                  <p className="mt-2 text-xs text-muted-foreground">Uploading image(s)...</p>
                )}
                {editImageError && <p className="mt-2 text-xs text-red-600">{editImageError}</p>}

                {editImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {editImages.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        <img src={img} alt={`Edit preview ${index + 1}`} className="w-full h-full object-cover" />

                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

                  <label>Image URL</label>
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={addImageUrl}
                    onChange={(e) => setAddImageUrl(e.target.value)}
                    className="input"
                  />

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
                    You can upload images and/or paste an Image URL.
                  </p>

                  {isAddImageUploading && (
                    <p className="text-xs text-gray-500 mt-2">Uploading image files...</p>
                  )}

                  {addImageError && <p className="text-xs text-red-500 mt-2">{addImageError}</p>}

                  {addImagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {addImagePreviews.map((img, i) => (
                      <div key={`${img}-${i}`} className="relative group">
                        <img
                          src={img}
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

      <ProductDeleteConfirmModal
        open={!!deleteItem && deleteType === 'product'}
        message={`Are you sure you want to delete this product${deleteItem?.name ? ` (${deleteItem.name})` : ''}? This action cannot be undone.`}
        isDeleting={isDeleteSubmitting}
        onCancel={() => {
          setDeleteItem(null);
          setDeleteType('');
        }}
        onConfirm={confirmDelete}
      />

      <ToastNotification toast={toast} />

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
