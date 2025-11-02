# Vitran API Endpoints - Quick Reference

Base URL: `https://theinfranova.com/api` (production) or `http://localhost:4000/api` (local)

All endpoints except `/auth/login` and `/auth/worker-login` require Bearer token in Authorization header.

---

## Authentication Endpoints

### Admin Login
```
POST /auth/login
Body: { email: string, password: string }
Response: { message, token, user: { id, email, name, role } }
```

### Worker Login
```
POST /auth/worker-login
Body: { phoneNumber: string, password: string }
Response: { success: true, token, userType: "WORKER", worker: { workerId, firstName, lastName, phoneNumber, role, isActive } }
```

### Validate Token
```
POST /auth/validate
Body: { token: string }
Response: { success, message, user }
```

---

## User Management (ADMIN ONLY)

### Create Admin
```
POST /users
Headers: Authorization: Bearer {token}
Body: { email, password, name }
```

### Get All Admins
```
GET /users
Headers: Authorization: Bearer {token}
```

### Get Admin Stats
```
GET /users/stats
Headers: Authorization: Bearer {token}
Response: { admins, workers, customers, total }
```

### Get Admin by ID
```
GET /users/:id
Headers: Authorization: Bearer {token}
```

### Update Admin
```
PUT /users/:id
Headers: Authorization: Bearer {token}
Body: { email?, name?, password? }
```

### Delete Admin
```
DELETE /users/:id
Headers: Authorization: Bearer {token}
```

---

## Worker Management (ADMIN ONLY)

### Create Worker
```
POST /workers
Headers: Authorization: Bearer {token}
Body: { firstName, lastName, phoneNumber, password, isActive? }
```

### Get All Workers
```
GET /workers
Headers: Authorization: Bearer {token}
```

### Get Worker by ID
```
GET /workers/:id
Headers: Authorization: Bearer {token}
```

### Update Worker
```
PUT /workers/:id
Headers: Authorization: Bearer {token}
Body: { firstName?, lastName?, phoneNumber?, password?, isActive? }
```

### Delete Worker
```
DELETE /workers/:id
Headers: Authorization: Bearer {token}
```

### Toggle Worker Status
```
PUT /workers/:id/toggle-status
Headers: Authorization: Bearer {token}
```

---

## Customer Management

### Create Customer
```
POST /customers
Body: { firstName, lastName, address1, address2?, phoneNumber, city, pincode, classification: "B2B" | "B2C" }
Response: { success, message, data: Customer }
```

### Get All Customers
```
GET /customers
Response: { success, message, data: Customer[] }
```

### Search Customer by Phone
```
GET /customers/search?phone={phoneNumber}
Response: { success, message, data: Customer | null }
```

### Get Customer by ID
```
GET /customers/:id
Response: { success, message, data: Customer }
```

### Update Customer
```
PATCH /customers/:id
Body: { firstName?, lastName?, address1?, address2?, phoneNumber?, city?, pincode?, classification? }
Response: { success, message, data: Customer }
```

---

## Product Management

### Create Product
```
POST /products
Body: { productName, currentProductPrice, lastProductPrice?, imageUrl?, description?, storeId: "SANCHI" | "SABORO" }
Response: { success, message, data: Product }
```

### Upload Product Image
```
POST /products/upload-image
Content-Type: multipart/form-data
Body: { image: File }
Response: { success, message, data: { imageUrl } }
```

### Get All Products
```
GET /products
Response: { success, message, data: Product[] }
```

### Get Products with Latest Inventory
```
GET /products/products-with-latest-inventory
Response: { success, message, data: Product[] } (includes inventory.inventoryId, inventory.date)
```

### Get Product by ID
```
GET /products/:id
Response: { success, message, data: Product }
```

### Update Product
```
PATCH /products/:id
Body: { productName?, currentProductPrice?, lastProductPrice?, imageUrl?, description?, storeId? }
Response: { success, message, data: Product }
```

### Delete Product
```
DELETE /products/:id
Response: { success, message, data: Product }
```

---

## Relations Management

### Get Worker-Customer Relations
```
GET /relations/worker-customers
Response: { success, message, data: WorkerCustomer[] }
```

### Assign Customer to Worker
```
POST /relations/assign-customer-to-worker
Body: { workerId, customerId, sequenceNumber }
Response: { success, message, data: WorkerCustomer }
```

### Remove Customer from Worker
```
DELETE /relations/worker-customer/:workerId/:customerId
Response: { success, message }
```

### Get Customer-Product Relations
```
GET /relations/customer-products
Response: { success, message, data: CustomerProduct[] }
```

### Assign Product to Customer
```
POST /relations/assign-product-to-customer
Body: { customerId, productId, fromDate?, thruDate?, quantityAssociated? }
Response: { success, message, data: CustomerProduct }
```

### Update Customer Product Quantity
```
PATCH /relations/customer-product/:customerId/:productId
Body: { quantityAssociated: number }
Response: { success, message, data: CustomerProduct }
```

### Remove Product from Customer
```
DELETE /relations/customer-product/:customerId/:productId
Response: { success, message }
```

### Get Available Customers for Worker
```
GET /relations/available-customers/:workerId
Response: { success, data: Customer[] }
```

### Get Available Products for Customer
```
GET /relations/available-products/:customerId
Response: { success, data: Product[] }
```

---

## Inventory Management (ADMIN ONLY)

### Calculate and Store Daily Demand
```
POST /inventory/update-all
Headers: Authorization: Bearer {token}
Body: { userId?, date? }
Response: { success, message, data: { count } }
```

### Update Received Quantity
```
POST /inventory/received/:productId
Headers: Authorization: Bearer {token}
Body: { receivedQuantity: number, userId: string }
Response: { success, message }
```

### Update Remaining Quantity
```
POST /inventory/remaining/:productId
Headers: Authorization: Bearer {token}
Body: { remainingQuantity: number, userId: string }
Response: { success, message }
```

### Get Inventory Summary
```
GET /inventory?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: Inventory[] }
```

### Get All Product Demand
```
GET /inventory/demand-all?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: ProductDemand[], meta: { date, totalProducts, totalDemand, calculated } }
```

---

## Daily Activity - Worker Inventory (WORKER)

### Pick Quantities (Morning)
```
POST /daily-activity-wi/pick-quantities
Headers: Authorization: Bearer {token}
Body: { workerId?, pickItems: [{ inventoryId, totalPickedQuantity }] }
Response: { success, message, data: WorkerInventory[] }
```

### Update Remaining Quantities (Evening)
```
PUT /daily-activity-wi/remaining-quantities
Headers: Authorization: Bearer {token}
Body: { workerId?, remainingItems: [{ inventoryId, remainingQuantity }] }
Response: { success, message, data: WorkerInventory[] }
```

### Get Worker Daily Activity
```
GET /daily-activity-wi/worker/:workerId?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: WorkerInventoryActivity[] }
```

### Get Worker Daily Summary
```
GET /daily-activity-wi/summary/:workerId?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: { date, totalProducts, totalPickedQuantity, totalRemainingQuantity, completedProducts, pendingProducts, distributedQuantity, efficiency } }
```

### Get Worker Activity History
```
GET /daily-activity-wi/history/:workerId?days={number}
Headers: Authorization: Bearer {token}
Response: { success, message, data: { [dateString]: WorkerInventory[] } }
```

---

## Daily Activity - Customer Inventory (WORKER)

### Get My Customers
```
GET /daily-activity-ci/my-customers
Headers: Authorization: Bearer {token}
Response: { success, message, data: WorkerCustomer[] } (sorted by sequenceNumber)
```

### Get My Inventory with Products
```
GET /daily-activity-ci/my-inventory?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: WorkerInventoryDetails[] }
```

### Get My Inventory Summary
```
GET /daily-activity-ci/my-inventory-summary?date={YYYY-MM-DD}
Headers: Authorization: Bearer {token}
Response: { success, message, data: { totalProducts, totalPickedQuantity, totalRemainingQuantity, completedProducts, pendingProducts, totalValue } }
```

---

## Deliveries (WORKER)

### Process Delivery
```
POST /deliveries/process
Headers: Authorization: Bearer {token}
Body: { customerId, inventoryId, deliveredQuantity, billAmount, isPriceCustomized: boolean }
Response: { success, message, data: { deliveryId, paymentId, customerName, productName, deliveredQuantity, billAmount, isPriceCustomized, collectionStatus, collectionReason, deliveryDate, isDuplicate, skipped } }
```

### Submit Cash in Hand
```
POST /deliveries/total-amount
Headers: Authorization: Bearer {token}
Body: { amount: number }
Response: { success, message, data: CashInHand }
```

### Get Cash in Hand
```
GET /deliveries/total-amount
Headers: Authorization: Bearer {token}
Response: { success, message, data: CashInHand | null }
```

---

## Verification

### Submit Verification
```
POST /verification/submit
Body: {
  deliveries: [{
    workerId, customerId, inventoryId, productName,
    deliveredQuantity, bill, isCollected
  }],
  cashData: [{ workerId, actualAmount }],
  verifiedBy: string
}
Response: { success, message, data: { dailyVerificationId, processedDeliveries, updatedCustomerInventoryRecords, updatedCashRecords, message } }
```

---

## Data Verification

### Get Daily Deliveries Overview
```
GET /data-verification/overview?date={YYYY-MM-DD}
Response: { success, message, data: [{
  workerId, workerName, customerId, customerName,
  inventoryId, productName, deliveredQuantity,
  bill, isCollected, verificationId
}] }
```

### Get Worker Cash Summary
```
GET /data-verification/cash-summary?date={YYYY-MM-DD}
Response: { success, message, data: [{ workerId, workerName, cashCollected }] }
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## Authentication Header Format

```
Authorization: Bearer {JWT_TOKEN}
```

---

## Common Query Parameters

- `date`: YYYY-MM-DD format (e.g., `2024-01-15`)
- `days`: Number (e.g., `7` for last 7 days)
- `phone`: Phone number string (e.g., `9876543210`)

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Notes

1. **Date Handling**: All dates are normalized to start of day (00:00:00 UTC)
2. **Duplicate Prevention**: Same customer + inventory + date = skipped
3. **Quantity Validation**: Remaining quantity cannot exceed picked quantity
4. **Active Records**: Relations use `thruDate: null` to indicate active status
5. **Worker Access**: Workers can only access their own data (enforced by JWT)

