# 📝 Soft Delete System - Code Changes Before & After

## 1️⃣ DATABASE MODEL - Product.js

### BEFORE
```javascript
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true, uppercase: true },
    price: { type: Number, required: true },
    // ... other fields
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "products" }
);
```

### AFTER
```javascript
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true, uppercase: true },
    price: { type: Number, required: true },
    // ... other fields
    inStock: { type: Boolean, default: true },
    // ✅ NEW: Soft delete fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "products" }
);
```

---

## 2️⃣ DELETE API - app/api/admin/products/[id]/route.js

### BEFORE (Hard Delete)
```javascript
export async function DELETE(req, { params }) {
  try {
    // ... auth check ...
    const { id } = await params;
    
    // ❌ WRONG: Hard delete - removes from database
    await Product.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

### AFTER (Soft Delete)
```javascript
export async function DELETE(req, { params }) {
  try {
    // ... auth check ...
    const { id } = await params;
    
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ CORRECT: Soft delete - marks as deleted
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    await AdminLog.create({
      adminName: "Admin",
      action: "Deleted product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## 3️⃣ PRODUCT ROUTES - routes/product.js

### BEFORE (No Delete Filter)
```javascript
// GET /api/products/latest
router.get("/latest", async (req, res) => {
  const limit = Math.max(1, Number(req.query.limit || 8));
  const products = await Product.find({})  // ❌ Gets all, including deleted
    .sort({ createdAt: -1 })
    .limit(limit);
  return res.status(200).json({ success: true, products });
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const product = await Product.findById(identifier)  // ❌ Could return deleted
    .lean();
  if (!product) return res.status(404);
  
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  });  // ❌ Could include deleted related products
});
```

### AFTER (Filters Deleted)
```javascript
// GET /api/products/latest
router.get("/latest", async (req, res) => {
  const limit = Math.max(1, Number(req.query.limit || 8));
  const products = await Product.find({ isDeleted: false })  // ✅ Excludes deleted
    .sort({ createdAt: -1 })
    .limit(limit);
  return res.status(200).json({ success: true, products });
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const product = await Product.findOne({ _id: identifier, isDeleted: false })  // ✅ Only non-deleted
    .lean();
  if (!product) return res.status(404);
  
  const relatedProducts = await Product.find({
    isDeleted: false,  // ✅ Excludes deleted
    category: product.category,
    _id: { $ne: product._id },
  });
});
```

---

## 4️⃣ ADMIN ROUTES - routes/admin.js

### BEFORE (Counts All Products)
```javascript
router.get("/analytics/overview", protectAdmin, async (_req, res) => {
  try {
    const [totalProducts, totalOrders] = await Promise.all([
      Product.countDocuments({}),  // ❌ Counts deleted products too
      Order.countDocuments({ isDeleted: false }),
    ]);
    
    return res.json({
      success: true,
      data: { kpis: { totalProducts, totalOrders } }
    });
  } catch (error) { /* ... */ }
});
```

### AFTER (Excludes Deleted Products)
```javascript
router.get("/analytics/overview", protectAdmin, async (_req, res) => {
  try {
    const [totalProducts, totalOrders] = await Promise.all([
      Product.countDocuments({ isDeleted: { $ne: true } }),  // ✅ Excludes deleted
      Order.countDocuments({ isDeleted: false }),
    ]);
    
    return res.json({
      success: true,
      data: { kpis: { totalProducts, totalOrders } }
    });
  } catch (error) { /* ... */ }
});
```

---

## 5️⃣ FRONTEND ERROR HANDLING - app/admin/orders/page.tsx

### BEFORE (Browser Alert)
```typescript
const confirmDelete = async () => {
  if (!selectedId) return;

  try {
    setDeletingId(selectedId);
    const res = await fetch(buildApiUrl(`/api/admin/orders/${selectedId}`), { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    const data = await parseResponseBody<any>(res);
    
    if (!res.ok) {
      // ❌ WRONG: Ugly browser alert
      alert(data.error || data.message || 'Failed to delete order');
      return;
    }
    
    setShowDeleteModal(false);
    setSelectedId(null);
    await fetchOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
  } finally {
    setDeletingId(null);
  }
};
```

### AFTER (Clean Error Message)
```typescript
const confirmDelete = async () => {
  if (!selectedId) return;

  try {
    setDeletingId(selectedId);
    const res = await fetch(buildApiUrl(`/api/admin/orders/${selectedId}`), { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    const data = await parseResponseBody<any>(res);
    
    if (!res.ok) {
      // ✅ CORRECT: Display via state, not browser alert
      setMessage({ type: 'error', text: data.error || data.message || 'Failed to delete order' });
      return;
    }
    
    setShowDeleteModal(false);
    setSelectedId(null);
    // ✅ Success message
    setMessage({ type: 'success', text: 'Order deleted successfully' });
    await fetchOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
    setMessage({ type: 'error', text: 'Failed to delete order' });
  } finally {
    setDeletingId(null);
  }
};
```

---

## 6️⃣ NEW: RESTORE ENDPOINT - app/api/admin/products/[id]/restore/route.js

### CREATED
```javascript
export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    // ✅ Only finds deleted products
    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: true },  // Only update if deleted
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: "Deleted product not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Restored product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Product restored successfully", 
      product 
    });
  } catch (error) {
    console.error("Failed to restore product:", error);
    return NextResponse.json({ error: "Failed to restore product" }, { status: 500 });
  }
}
```

---

## 7️⃣ NEW: DELETED PRODUCTS ENDPOINT - app/api/admin/products/deleted/route.js

### CREATED
```javascript
export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    
    // ✅ Only fetches deleted products
    const products = await Product.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select("name sku price image deletedAt createdAt");

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/products/deleted error:", error);
    return NextResponse.json({ error: "Failed to fetch deleted products" }, { status: 500 });
  }
}
```

---

## 8️⃣ NEW: PERMANENT DELETE ENDPOINT - app/api/admin/products/[id]/permanent/route.js

### CREATED
```javascript
export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ✅ Only allow permanent delete for already-deleted items
    if (!product.isDeleted) {
      return NextResponse.json(
        { error: "Only deleted products can be permanently deleted" }, 
        { status: 400 }
      );
    }

    // ✅ Hard delete from database
    await Product.findByIdAndDelete(id);

    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Product permanently deleted" 
    });
  } catch (error) {
    console.error("Failed to permanently delete product:", error);
    return NextResponse.json({ error: "Failed to permanently delete product" }, { status: 500 });
  }
}
```

---

## 9️⃣ TRASH PAGE UPDATE - app/admin/trash/page.tsx

### BEFORE (Only Orders & Customers)
```typescript
type TrashTab = 'orders' | 'customers';

interface DeletedCustomer { _id: string; name?: string; email?: string; deletedAt?: string; }

export default function AdminTrashPage() {
  const [orders, setOrders] = useState<DeletedOrder[]>([]);
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  
  // Two tabs only
  <button onClick={() => setTab('orders')}>Deleted Orders</button>
  <button onClick={() => setTab('customers')}>Deleted Customers</button>
}
```

### AFTER (Added Products Tab)
```typescript
type TrashTab = 'orders' | 'customers' | 'products';  // ✅ Added 'products'

interface DeletedProduct { _id: string; name?: string; sku?: string; price?: number; deletedAt?: string; }

export default function AdminTrashPage() {
  const [orders, setOrders] = useState<DeletedOrder[]>([]);
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  const [products, setProducts] = useState<DeletedProduct[]>([]);  // ✅ NEW
  
  // Fetch products too
  const productsRes = await fetch(buildApiUrl('/api/admin/products/deleted'), {...});
  
  // Three tabs
  <button onClick={() => setTab('orders')}>Deleted Orders ({orders.length})</button>
  <button onClick={() => setTab('customers')}>Deleted Customers ({customers.length})</button>
  <button onClick={() => setTab('products')}>Deleted Products ({products.length})</button>  {/* ✅ NEW */}
  
  // Render products table
  {tab === 'products' && (
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Price</th>
          <th>Deleted Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr>
            <td>{product.name}</td>
            <td>{product.sku}</td>
            <td>₹{product.price}</td>
            <td>{formatDeletedDate(product.deletedAt)}</td>
            <td>
              <button onClick={() => handleRestore(product._id, 'products')}>Restore</button>
              <button onClick={() => setPendingDelete({id: product._id, tab: 'products'})}>Permanent Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
}
```

---

## 📊 Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| **Models** | Added isDeleted, deletedAt | Enable soft delete tracking |
| **Delete APIs** | Hard delete → Soft delete | Safe, reversible deletion |
| **List APIs** | Add `{ isDeleted: false }` filter | Hide deleted items |
| **Restore APIs** | NEW endpoints | Recovery capability |
| **Permanent Delete APIs** | NEW endpoints | Final deletion from trash |
| **Trash Page** | Added products tab | Unified trash management |
| **Frontend Errors** | alert() → setMessage() | Professional UI |
| **Admin Logs** | New entries on delete/restore | Audit trail |

---

## ✅ Verification Checklist

After deployment:
1. ✅ Delete a product - should appear in trash, not list
2. ✅ Restore a product - should return to active list
3. ✅ Permanently delete - should remove from database completely
4. ✅ Deleted items don't appear in dashboard stats
5. ✅ All error messages use clean UI (not browser alerts)
6. ✅ Admin logs record all operations
7. ✅ Related products query excludes deleted items
8. ✅ Orders, Products, Customers all work the same way
