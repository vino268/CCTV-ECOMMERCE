'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Upload, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

type FormErrors = Partial<Record<'name' | 'sku' | 'price' | 'category' | 'description' | 'images' | 'features', string>>;

interface CategoryItem {
  _id: string;
  name: string;
}

interface AddProductForm {
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

function generateSku(category: string) {
  const prefixMap: Record<string, string> = {
    Cameras: 'CAM',
    Accessories: 'ACC',
    'DVR & NVR': 'DVR',
    Networking: 'NET',
    Storage: 'STO',
  };

  const prefix = prefixMap[category] || 'GEN';
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<AddProductForm>({
    name: '',
    sku: '',
    price: '',
    category: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState('');

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  const isFormSubmittable = useMemo(() => {
    return (
      !!form.name.trim() &&
      !!form.sku.trim() &&
      !!form.price.trim() &&
      Number(form.price) > 0 &&
      !!form.category.trim() &&
      !!form.description.trim()
    );
  }, [form]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json().catch(() => ({}));

      const nextCategories = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : [];

      console.log('Admin add categories API response:', data);
      setCategories(nextCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, category: 'Category name is required.' }));
      return;
    }

    try {
      setIsAddingCategory(true);
      setCategoryMessage('');
      const res = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          category: payload.error || 'Failed to add category.',
        }));
        return;
      }

      setNewCategoryName('');
      setCategoryMessage('Category added successfully.');
      await fetchCategories();
    } catch (error) {
      setErrors((prev) => ({ ...prev, category: 'Failed to add category.' }));
    } finally {
      setIsAddingCategory(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    try {
      setIsUploadingImages(true);

      const merged = [...images, ...validFiles].slice(0, 5);
      setImages(merged);
      setImageNames(merged.map((file) => file.name));
      setImagePreviews(merged.map((file) => URL.createObjectURL(file)));

      // Mandatory debug log to verify selected files before upload.
      console.log(merged);

      if (errors.images) {
        setErrors((prev) => ({ ...prev, images: undefined }));
      }
    } finally {
      setIsUploadingImages(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addFeature = () => {
    const value = featureInput.trim();
    if (!value) return;

    setFeatures((prev) => [...prev, value]);
    setFeatureInput('');
    if (errors.features) setErrors((prev) => ({ ...prev, features: undefined }));
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageNames((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Product name is required.';
    if (!form.sku.trim()) nextErrors.sku = 'SKU is required.';
    if (!form.price.trim() || Number(form.price) <= 0) nextErrors.price = 'Price must be greater than 0.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('sku', form.sku.trim());
      formData.append('price', String(Number(form.price)));
      formData.append('category', form.category.trim());
      formData.append('description', form.description.trim());
      formData.append('inStock', 'true');
      formData.append('features', JSON.stringify(features));

      for (let i = 0; i < images.length; i += 1) {
        formData.append('images', images[i]);
      }

      // Mandatory debug log to ensure request uses file objects.
      console.log(images);

      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(result?.message || result?.error || 'Upload failed');
        setErrors((prev) => ({
          ...prev,
          name: result?.fieldErrors?.name || prev.name,
          sku: result?.fieldErrors?.sku || prev.sku,
          price: result?.fieldErrors?.price || prev.price,
          category: result?.fieldErrors?.category || prev.category,
          description: result?.fieldErrors?.description || prev.description,
        }));
        return;
      }

      alert('Product created successfully');

      router.push('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="text-muted-foreground">Create product with full details and image gallery.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/admin/products')}>
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Button>
          <Button variant="outline" className="gap-2" onClick={fetchCategories}>
            <RefreshCw className="w-4 h-4" /> Refresh Categories
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">SKU *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }));
                    setSkuManuallyEdited(true);
                    if (errors.sku) setErrors((prev) => ({ ...prev, sku: undefined }));
                  }}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Auto-generated or edit manually"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, sku: generateSku(form.category) }));
                    setSkuManuallyEdited(true);
                  }}
                >
                  Auto
                </Button>
              </div>
              {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Price *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, price: e.target.value }));
                  if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                }}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="₹0.00"
              />
              {Number(form.price) > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Preview: {formatPrice(Number(form.price))}</p>
              )}
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const nextCategory = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    category: nextCategory,
                    sku: !skuManuallyEdited || !prev.sku ? generateSku(nextCategory) : prev.sku,
                  }));
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                disabled={loadingCategories}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}

              <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  placeholder="Add new category"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button type="button" variant="outline" onClick={handleAddCategory} disabled={isAddingCategory}>
                  {isAddingCategory ? 'Adding...' : 'Add Category'}
                </Button>
              </div>
              {categoryMessage && <p className="mt-1 text-xs text-green-600">{categoryMessage}</p>}
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }));
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Enter product description"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
              placeholder="Enter feature"
              className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button type="button" variant="outline" onClick={addFeature}>
              <Plus className="w-4 h-4 mr-2" /> Add Feature
            </Button>
          </div>

          {features.length > 0 && (
            <div className="mt-4 space-y-2">
              {features.map((feature, index) => (
                <div
                  key={`${feature}-${index}`}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm text-foreground inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    {feature}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.features && <p className="mt-2 text-xs text-red-600">{errors.features}</p>}
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Image Upload</h2>

          <div
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
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
              handleImageFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />
            <p className="text-sm text-muted-foreground mb-3">Upload or drag & drop product images</p>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={isUploadingImages}>
              <Upload className="w-4 h-4 mr-2" /> {isUploadingImages ? 'Uploading...' : 'Choose Images'}
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Use only uploaded files. External image URLs are blocked.
          </p>

          {imageNames.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Selected: {imageNames.join(', ')}</p>
          )}

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((image, index) => (
                <div key={`${imageNames[index] || 'image'}-${index}`} className="relative">
                  <img
                    src={image}
                    alt={`Product preview ${index + 1}`}
                    className="w-full h-28 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.images && <p className="mt-2 text-xs text-red-600">{errors.images}</p>}
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex gap-3">
            <Button type="submit" disabled={!isFormSubmittable || isSubmitting || isUploadingImages}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Creating Product...
                </span>
              ) : isUploadingImages ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Uploading Images...
                </span>
              ) : (
                'Save Product'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
