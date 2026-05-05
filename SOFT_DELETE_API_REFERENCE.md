# 🔌 Soft Delete System - API Reference

## DELETE (Soft Delete - Move to Trash)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| DELETE | `/api/admin/products/[id]` | Soft delete product | Admin ✓ |
| DELETE | `/api/admin/orders/:id` | Soft delete order (Express) | Admin ✓ |
| PATCH | `/api/admin/users/[id]/delete` | Soft delete user | Admin ✓ |

**Response**: `{ success: true }`

---

## RESTORE (Recover from Trash)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| PATCH | `/api/admin/products/[id]/restore` | Restore product | Admin ✓ |
| PATCH | `/api/admin/orders/[id]/restore` | Restore order | Admin ✓ |
| PATCH | `/api/admin/customers/[id]/restore` | Restore customer | Admin ✓ |

**Response**: `{ success: true, message: "... restored successfully", product/order/customer: {...} }`

---

## PERMANENT DELETE (Hard Delete from Trash Only)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| DELETE | `/api/admin/products/[id]/permanent` | Permanently delete product | Admin ✓ |
| DELETE | `/api/admin/orders/[id]/permanent` | Permanently delete order | Admin ✓ |
| DELETE | `/api/admin/customers/[id]/permanent` | Permanently delete customer | Admin ✓ |

**Response**: `{ success: true, message: "... permanently deleted" }`

---

## GET DELETED ITEMS

| Method | Endpoint | Returns | Auth |
|--------|----------|---------|------|
| GET | `/api/admin/products/deleted` | All deleted products | Admin ✓ |
| GET | `/api/admin/orders/deleted` | All deleted orders | Admin ✓ |
| GET | `/api/admin/customers/deleted` | All deleted customers | Admin ✓ |

**Response**: `[ { _id, name, deletedAt, ... }, ... ]`

---

## GET ACTIVE ITEMS (Excludes Deleted)

| Method | Endpoint | Filters | Auth |
|--------|----------|---------|------|
| GET | `/api/products` | `{ isDeleted: false }` | Public |
| GET | `/api/products/latest` | `{ isDeleted: false }` | Public |
| GET | `/api/products/:id` | `{ isDeleted: false }` | Public |
| GET | `/api/admin/products` | (Express route, active only) | Admin ✓ |
| GET | `/api/admin/orders` | `{ isDeleted: false }` | Admin ✓ |
| GET | `/api/admin/customers?status=active` | `{ isDeleted: false }` | Admin ✓ |

---

## BULK OPERATIONS

| Method | Endpoint | Purpose | Body |
|--------|----------|---------|------|
| POST | `/api/admin/trash/delete-selected` | Delete multiple items | `{ ids: [...], tab: "orders"\|"customers"\|"products" }` |
| DELETE | `/api/admin/trash/delete-all?tab=...` | Delete all in tab | - |

---

## FILTERS IN QUERIES

### Products
```javascript
GET /api/products
GET /api/products/latest
GET /api/products/:id

// All use internally: { isDeleted: false }
```

### Customers
```javascript
GET /api/admin/customers?status=active   // { isDeleted: false }
GET /api/admin/customers?status=deleted  // { isDeleted: true }
GET /api/admin/customers?status=all      // No filter
```

### Orders
```javascript
GET /api/admin/orders                     // { isDeleted: false }
GET /api/admin/dashboard-stats            // { isDeleted: false }
GET /api/admin/analytics/overview         // { isDeleted: false }
```

---

## EXAMPLE FLOWS

### Delete a Product
```bash
curl -X DELETE "http://localhost:3000/api/admin/products/[id]" \
  -H "Cookie: admin_session=[token]"

# Response: { success: true }
# Effect: Sets isDeleted=true, deletedAt=NOW
```

### Restore a Product
```bash
curl -X PATCH "http://localhost:3000/api/admin/products/[id]/restore" \
  -H "Cookie: admin_session=[token]"

# Response: { success: true, message: "Product restored...", product: {...} }
# Effect: Sets isDeleted=false, deletedAt=null
```

### Permanently Delete a Product
```bash
curl -X DELETE "http://localhost:3000/api/admin/products/[id]/permanent" \
  -H "Cookie: admin_session=[token]"

# Response: { success: true, message: "Product permanently deleted" }
# Effect: Product completely removed from database
```

### Get Deleted Products
```bash
curl -X GET "http://localhost:3000/api/admin/products/deleted" \
  -H "Cookie: admin_session=[token]"

# Response: [
#   { _id: "...", name: "Product 1", sku: "SKU1", price: 100, deletedAt: "2024-..." },
#   ...
# ]
```

---

## ERROR RESPONSES

### 400 - Bad Request
```json
{ "error": "Invalid product id" }
```

### 404 - Not Found
```json
{ "error": "Product not found" }
```

### 401 - Unauthorized
```json
{ "success": false, "message": "Unauthorized" }
```

### 500 - Server Error
```json
{ "error": "Failed to delete product" }
```

---

## AUTHENTICATION

All endpoints require admin authentication via HttpOnly cookie:
- Cookie name: `admin_session`
- Verified by: `verifyAdmin(req)` middleware
- Scope: `/api/admin/*` routes only

---

## STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation) |
| 404 | Item not found |
| 401 | Not authenticated |
| 403 | Not authorized |
| 500 | Server error |

---

## CACHING

```javascript
// App Router (Next.js)
cache: 'no-store'  // Always fresh data

// Browser caching
credentials: 'include'  // Include cookies
```

---

## LOGGING

All delete/restore operations logged to AdminLog collection:
```javascript
{
  adminName: "Admin",
  action: "Deleted product",
  details: "Product Name",
  createdAt: <timestamp>
}
```

---

## RATE LIMITING

No rate limiting currently implemented. Consider adding if needed for production.

---

## PAGINATION

Most list endpoints support pagination:
```javascript
?page=1&limit=50
```

Check individual endpoint docs for specific parameters.
