'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Upload, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { buildApiUrl } from '@/lib/http-response';
import imageCompression from 'browser-image-compression';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

type FormErrors = Partial<Record<'name' | 'sku' | 'price' | 'category' | 'description' | 'images' | 'imageUrl' | 'features', string>>;

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

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
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
      const res = await fetch(buildApiUrl('/api/categories'), { cache: 'no-store' });
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
      const res = await fetch(buildApiUrl('/api/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = payload?.message || payload?.error || 'Request failed';
        toast.error(errMsg);
        setErrors((prev) => ({
          ...prev,
          category: errMsg,
        }));
        return;
      }

      if (payload.category) {
        setCategories((prev) => [payload.category, ...prev.filter((category) => category._id !== payload.category._id)]);
      }
      setNewCategoryName('');
      toast.success('Category created successfully');
      await fetchCategories();
    } catch (error: any) {
      console.log(error);
      if (error?.message) {
        toast.error(error.message);
      }
      setErrors((prev) => ({ ...prev, category: 'Failed to add category.' }));
    } finally {
      setIsAddingCategory(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


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


  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Product name is required.';
    if (!form.sku.trim()) nextErrors.sku = 'SKU is required.';
    if (!form.price.trim() || Number(form.price) <= 0) nextErrors.price = 'Price must be greater than 0.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';

    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl && !/^https?:\/\//i.test(trimmedImageUrl)) {
      nextErrors.imageUrl = 'Invalid image URL. It must start with http or https.';
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (previewImages.length === 0 && !imageUrl.trim()) {
      toast.error("Please add at least one valid image");
      return;
    }

    try {
      setIsSubmitting(true);

      const trimmedImageUrl = imageUrl.trim();
      const finalImages = [...previewImages];
      if (trimmedImageUrl && !finalImages.includes(trimmedImageUrl)) {
        finalImages.push(trimmedImageUrl);
      }
      
      const finalImage = finalImages[0] || '';
      
      console.log("Images sending:", finalImages);

      const res = await fetch(buildApiUrl('/api/products'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim(),
          price: Number(form.price),
          category: form.category.trim(),
          description: form.description.trim(),
          inStock: true,
          features,
          images: finalImages,
          image: finalImage,
          imageUrl: trimmedImageUrl,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(result?.message || result?.error || 'Request failed');
        setErrors((prev) => ({
          ...prev,
          name: result?.fieldErrors?.name || prev.name,
          sku: result?.fieldErrors?.sku || prev.sku,
          price: result?.fieldErrors?.price || prev.price,
          category: result?.fieldErrors?.category || prev.category,
          description: result?.fieldErrors?.description || prev.description,
          images: result?.fieldErrors?.images || prev.images,
        }));
        return;
      }

      toast.success('Product created successfully');

      router.push('/admin/products');
    } catch (error: any) {
      console.log(error);
      if (error?.message) {
        toast.error(error.message);
      }
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
          <h2 className="text-lg font-semibold mb-4">Image Gallery</h2>

          <div className="mb-8 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5">External Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
                }}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              {imageUrl.trim() && (
                <div className="mt-4">
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.jpg';
                    }}
                  />
                </div>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                const trimmed = imageUrl.trim();
                const isValidImage = (url: string) => {
                  if (/^https?:\/\//i.test(url)) return true; // Accept any valid URL structure for now, but fallback to onError
                  return false;
                };

                if (trimmed && isValidImage(trimmed)) {
                  setPreviewImages(prev => [...prev, trimmed]);
                  setImageUrl('');
                  if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: undefined }));
                } else if (trimmed) {
                  setErrors(prev => ({ ...prev, imageUrl: 'Invalid URL. Must be a full HTTP/HTTPS link.' }));
                }
              }}
            >
              Add URL
            </Button>
          </div>
          {errors.imageUrl && <p className="mt-1 mb-4 text-xs text-red-600">{errors.imageUrl}</p>}

          <div className="space-y-4">
            <label className="block text-sm font-medium">Upload Product Images</label>
            <ImageUploader onUploadComplete={(urls) => setPreviewImages(prev => [...prev, ...urls])} />
          </div>

          {previewImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold mb-3">Image Gallery Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border shadow-sm group">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-md rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground z-20 shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.images && <p className="mt-4 text-xs text-red-600 font-medium">{errors.images}</p>}
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex gap-3">
            <Button type="submit" disabled={!isFormSubmittable || isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Creating Product...
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
