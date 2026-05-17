'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, X, RefreshCw, Upload } from 'lucide-react';
import ProductDeleteConfirmModal from '@/components/admin/ProductDeleteConfirmModal';
import { getSafeImageSrc } from '@/lib/product-image';
import { getAdminAuthHeaders } from '@/lib/admin-auth';
import toast from 'react-hot-toast';
import { buildApiUrl } from '@/lib/http-response';
import imageCompression from 'browser-image-compression';

function notifyDashboardCountsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:counts-changed'));
  }
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryModalType, setCategoryModalType] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [newCategory, setNewCategory] = useState('');
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
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [addImageUrl, setAddImageUrl] = useState('');
  const [shippingText, setShippingText] = useState('Across India');
  const [warrantyYears, setWarrantyYears] = useState<number>(1);
  const [returnDays, setReturnDays] = useState<number>(10);
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
  const [editShippingText, setEditShippingText] = useState('Across India');
  const [editWarrantyYears, setEditWarrantyYears] = useState<number>(1);
  const [editReturnDays, setEditReturnDays] = useState<number>(10);
  
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
    setNewCategory('');
    setCategoryName('');
  };

  const handleSubmitCategoryModal = async () => {
    if (!categoryModalType) return;

    const name = categoryName.trim();
    const isAdd = categoryModalType === 'add';
    const isEdit = categoryModalType === 'edit';
    const addCategoryName = newCategory.trim();
    const editCategoryName = categoryName.trim();
    const nextName = isAdd ? addCategoryName : editCategoryName;

    if ((isAdd || isEdit) && !nextName) {
      setCategoryError('Category name is required.');
      return;
    }

    if ((isEdit) && !selectedCategory) {
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

      if (isAdd) {
        const res = await fetch(buildApiUrl('/api/categories'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: addCategoryName }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok || !payload?.success) {
          throw new Error(payload.message || payload.error || 'Failed to create category');
        }

        if (payload.category) {
          setCategories((prev) => [payload.category, ...prev.filter((cat) => cat._id !== payload.category._id)]);
        }
        setNewCategory('');
        closeCategoryModal();
        toast.success("Category created successfully");
        await fetchCategories();
        return;
      }

      const method = isEdit ? 'PUT' : 'DELETE';
      const url = buildApiUrl(`/api/admin/categories/${selectedCategory?._id}`);

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: isEdit ? JSON.stringify({ name: editCategoryName }) : undefined,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fallbackError = isEdit
          ? 'Failed to update category'
          : 'Failed to delete category';
        throw new Error(payload.message || payload.error || fallbackError);
      }

      closeCategoryModal();
      toast.success(isEdit ? "Category updated successfully" : "Category deleted successfully");
      await fetchCategories();
    } catch (err: any) {
      console.log(err);
      if (err?.message) {
        toast.error(err.message);
      }
      const errMsg = err.message || (isEdit ? 'Failed to update category' : 'Failed to create category');
      setCategoryError(errMsg);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return [] as string[];

    const uploadedImages = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          (async () => {
            try {
              const formData = new FormData();
              formData.append('image', file);

              const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/upload`;

              const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
              });

              const data = await response.json();
              console.log('UPLOAD RESPONSE:', data);

              if (!response.ok) {
                reject(data.error || data.message || 'Upload failed');
                return;
              }

              const uploadedUrl = data.url || data.imageUrl || data.secure_url;
              if (!uploadedUrl) {
                reject('Upload response missing image URL');
                return;
              }

              resolve(uploadedUrl);
            } catch (err) {
              reject(err);
            }
          })();
        });
      })
    );

    return uploadedImages;
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

  const handleImageUpload = async (input: React.ChangeEvent<HTMLInputElement> | FileList | null) => {
    const files = input instanceof FileList
      ? Array.from(input)
      : Array.from(input?.target?.files || []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    if (validFiles.length === 0) return;

    try {
      setIsAddImageUploading(true);
      setAddImageError('');

      const uploadedImages = await uploadFiles(validFiles);
      const merged = [...addImages, ...uploadedImages].slice(0, 5);
      setAddImages(merged);
      setAddImagePreviews(merged);
      if (input && !(input instanceof FileList)) {
        input.target.value = '';
      }
    } catch (err: any) {
      setAddImageError(err.message || 'Image upload failed');
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

      const finalImage = addImages[0] || trimmedImageUrl;
      const finalImages = addImages.length > 0
        ? addImages
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
          price: Math.round(Number(addFormData.price)),
          category: addFormData.category,
          description: addFormData.description.trim(),
          inStock: true,
          images: finalImages,
          image: finalImage,
          imageUrl: trimmedImageUrl,
            shippingText,
            warrantyYears,
            returnDays,
        }),
      });

      console.log('📤 Admin - Add payload sent:', {
        shippingText,
        warrantyYears,
        returnDays,
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
      setShippingText('Across India');
      setWarrantyYears(1);
      setReturnDays(10);
      if (addFileRef.current) addFileRef.current.value = '';
      setShowAddModal(false);
      notifyDashboardCountsChanged();
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
    setEditShippingText(product.shippingText || 'Across India');
    setEditWarrantyYears(Number(product.warrantyYears ?? 1));
    setEditReturnDays(Number(product.returnDays ?? 10));
  };

  const handleEditImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    try {
      setIsEditImageUploading(true);
      setEditImageError('');

      const uploadedUrls = await uploadFiles(validFiles);
      setEditImages((prev) => Array.from(new Set([...prev, ...uploadedUrls])).slice(0, 5));
    } catch (err: any) {
      setEditImageError(err.message || 'Image upload failed.');
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
          price: Math.round(Number(editFormData.price)),
          category: editFormData.category,
          description: editFormData.description,
          images: imageList,
          image: imageList[0] || '',
          inStock: editInStock,
          shippingText: editShippingText,
          warrantyYears: editWarrantyYears,
          returnDays: editReturnDays,
        }),
      });

      console.log('📤 Admin - Update payload sent:', {
        shippingText: editShippingText,
        warrantyYears: editWarrantyYears,
        returnDays: editReturnDays,
        typeShipping: typeof editShippingText,
        typeWarranty: typeof editWarrantyYears,
        typeReturnDays: typeof editReturnDays,
      });

      const responseData = await res.json().catch(() => ({}));
      console.log('Update product response:', {
        ok: res.ok,
        shippingText: responseData?.shippingText,
        warrantyYears: responseData?.warrantyYears,
        returnDays: responseData?.returnDays,
      });

      if (res.ok) {
        toast.success('Updated successfully');
        await fetchProducts();
        setEditProduct(null);
        notifyDashboardCountsChanged();
        router.refresh();
      } else {
        toast.error(responseData?.message || responseData?.error || 'Request failed');
      }
    } catch (err: any) {
      console.log(err);
      if (err?.message) {
        toast.error(err.message);
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || deleteType !== 'product') return;

    const id = deleteItem._id;

    if (!id) {
      console.error('Delete product error: missing MongoDB _id', deleteItem);
      toast.error('Unable to delete product: missing product id');
      return;
    }

    try {
      setIsDeleteSubmitting(true);
      console.log('Deleting product id:', id);

      const res = await fetch(buildApiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        cache: 'no-store',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      console.log('Delete product API response:', data);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to delete product');
      }

      // INSTANTLY UPDATE FRONTEND STATE
      if (data.success) {
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
        toast.success('Product deleted successfully');
      } else {
        toast.error(data?.message || 'Something went wrong');
      }
      
      // Refresh to sync with server
      await fetchProducts(currentPage);
      notifyDashboardCountsChanged();
      router.refresh();
    } catch (err: any) {
      console.log(err);
      if (err?.message) {
        toast.error(err.message);
      }
    } finally {
      setIsDeleteSubmitting(false);
    }
  };
  const filteredProducts = products.filter((product) => {
    const text = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(text) ||
      product.category?.toLowerCase().includes(text) ||
      String(product.price || "").toLowerCase().includes(text) ||
      product.sku?.toLowerCase().includes(text)
    );
  });

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
              setNewCategory('');
              setCategoryName('');
              setCategoryError('');
            }}
            className="w-full sm:w-auto"
          >
            Add Category
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {categories.length > 0 ? (
            categories.map((cat) => (
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
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">No categories found</div>
          )}
        </div>
        {categoryError && <p className="mt-2 text-xs text-red-600">{categoryError}</p>}
      </Card>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <Card className="border">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No products found</div>
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
                {filteredProducts.map((product) => {
                  const id = product._id;
                  return (
                    <tr key={id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        {product.images?.[0] || product.image ? (
                          <img
                            src={getSafeImageSrc(product.images?.[0] || product.image, '/products/default.jpg')}
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
                      <td className="p-4 font-medium text-foreground whitespace-nowrap">₹{Number(product.price).toLocaleString("en-IN")}</td>
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
                        <img
                          src={img}
                          alt={`Edit preview ${index + 1}`}
                          className="w-24 h-24 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />

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

              <div className="bg-white border rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-lg">Product Features</h3>

                <div>
                  <label className="block text-sm mb-1">Free Shipping Area</label>
                  <select
                    value={editShippingText}
                    onChange={(e) => setEditShippingText(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Across Tamil Nadu">Across Tamil Nadu</option>
                    <option value="Across India">Across India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Warranty (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={editWarrantyYears}
                    onChange={(e) => setEditWarrantyYears(Number(e.target.value))}
                    className="w-full border rounded-lg p-2"
                    placeholder="Enter years"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Return Policy (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editReturnDays}
                    onChange={(e) => setEditReturnDays(Number(e.target.value))}
                    className="w-full border rounded-lg p-2"
                    placeholder="Enter return days"
                  />
                </div>
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
                          Preview: ₹{Number(addFormData.price).toLocaleString("en-IN")}
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

                  {addImageUrl.trim() && (
                    <div className="mt-4">
                      <img
                        src={addImageUrl.trim()}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                  )}

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
                      handleImageUpload(e.dataTransfer.files);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      ref={addFileRef}
                      onChange={handleImageUpload}
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
                    <div className="flex gap-2 flex-wrap mt-3">
                    {addImagePreviews.map((img, i) => (
                      <div
                        key={`${img}-${i}`}
                        className="relative border rounded overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Preview ${i + 1}`}
                          className="w-24 h-24 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAddImage(i)}
                          className="absolute top-0 right-0 bg-red-500 text-white px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    </div>
                  )}
                </div>

                  <div className="bg-white border rounded-xl p-4 space-y-4">
                    <h3 className="font-semibold text-lg">
                      Product Features
                    </h3>

                    <div>
                      <label className="block text-sm mb-1">
                        Free Shipping Area
                      </label>

                      <select
                        value={shippingText}
                        onChange={(e) => setShippingText(e.target.value)}
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="Across Tamil Nadu">Across Tamil Nadu</option>
                        <option value="Across India">Across India</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Warranty (Years)
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={warrantyYears}
                        onChange={(e) => setWarrantyYears(Number(e.target.value))}
                        className="w-full border rounded-lg p-2"
                        placeholder="Enter years"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Return Policy (Days)
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={returnDays}
                        onChange={(e) => setReturnDays(Number(e.target.value))}
                        className="w-full border rounded-lg p-2"
                        placeholder="Enter return days"
                      />
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {categoryModalType === 'add' && 'Add Category'}
                {categoryModalType === 'edit' && 'Edit Category'}
                {categoryModalType === 'delete' && 'Delete Category'}
              </h2>

              <button
                onClick={closeCategoryModal}
                className="text-gray-400 hover:text-black text-xl"
                disabled={isCategorySubmitting}
                aria-label="Close category modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {(categoryModalType === 'add' || categoryModalType === 'edit') && (
                <input
                  type="text"
                  value={categoryModalType === 'add' ? newCategory : categoryName}
                  onChange={(e) => {
                    if (categoryModalType === 'add') {
                      setNewCategory(e.target.value);
                    } else {
                      setCategoryName(e.target.value);
                    }
                    if (categoryError) setCategoryError('');
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Enter category name"
                />
              )}

              {categoryModalType === 'delete' && (
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">"{selectedCategory?.name}"</span>?
                </p>
              )}

              {categoryError && <p className="text-xs text-red-600">{categoryError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCategoryModal}
                className="rounded-xl border px-5 py-2 hover:bg-gray-100"
                disabled={isCategorySubmitting}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitCategoryModal}
                className={`rounded-xl px-5 py-2 text-white ${
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
                    : 'Save Category'}
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
