# Vitran System - Complete Architecture Documentation

## Overview
Vitran is a dairy distribution management system with three main components:
1. **Backend** (NestJS) - REST API server
2. **Frontend** (Next.js) - Admin web dashboard
3. **Mobile App** (React Native/Expo) - Worker mobile application

---

## System Architecture

### Tech Stack
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Mobile**: React Native, Expo Router, AsyncStorage

### Database Schema (Prisma)
**Location**: `/vitran-2.0/prisma/schema.prisma`

#### Core Models:
1. **User** - Admin users (email/password auth)
2. **Worker** - Delivery workers (phone/password auth)
3. **Customer** - Customers receiving deliveries (B2B/B2C classification)
4. **Product** - Milk/dairy products with prices (SANCHI/SABORO stores)
5. **WorkerCustomer** - Assignment of customers to workers with sequence numbers
6. **CustomerProduct** - Customer product subscriptions with quantities
7. **Inventory** - Daily inventory records per product (received/remaining quantities)
8. **WorkerInventory** - Worker's picked and remaining quantities for the day
9. **CustomerInventory** - Delivery records (what was delivered to which customer)
10. **PaymentReceived** - Payment tracking (bill amount, collected status)
11. **CashInHand** - Worker's daily cash collection
12. **VerifiedDelivery** - Admin verification records
13. **ProductDemand** - Calculated daily demand per product

---

## Authentication System

### Backend Auth Flow
**File**: `/vitran-2.0/backend/src/auth/auth.service.ts`

#### Endpoints:
1. **POST `/api/auth/login`** - Admin login
   - Uses email + password
   - Returns JWT token with role=ADMIN

2. **POST `/api/auth/worker-login`** - Worker login
   - Uses phone number + password
   - Validates worker is active
   - Returns JWT token with userType=WORKER

3. **POST `/api/auth/validate`** - Token validation
   - Validates JWT and returns user/worker info

#### JWT Guard Implementation
**File**: `/vitran-2.0/backend/src/auth/guards/jwt-auth.guard.ts`
- Extracts Bearer token from Authorization header
- Validates token using AuthService
- Attaches user/worker info to `request.user`

#### Role-Based Access Control
**File**: `/vitran-2.0/backend/src/auth/guards/roles.guard.ts`
- Enforces role requirements (@Roles decorator)
- ADMIN: Full access
- WORKER: Limited to own data

---

## Complete API Endpoints Reference

### 1. AUTHENTICATION (`/api/auth`)
- `POST /login` - Admin login
- `POST /worker-login` - Worker login
- `POST /validate` - Validate JWT token

### 2. USERS (`/api/users`) - ADMIN ONLY
- `POST /` - Create admin user
- `GET /` - Get all admin users
- `GET /stats` - Get user statistics
- `GET /:id` - Get admin by ID
- `PUT /:id` - Update admin
- `DELETE /:id` - Delete admin

### 3. WORKERS (`/api/workers`) - ADMIN ONLY
- `POST /` - Create worker
- `GET /` - Get all workers
- `GET /:id` - Get worker by ID
- `PUT /:id` - Update worker
- `DELETE /:id` - Delete worker
- `PUT /:id/toggle-status` - Activate/deactivate worker

### 4. CUSTOMERS (`/api/customers`)
- `POST /` - Create customer
- `GET /` - Get all customers
- `GET /search?phone=...` - Find customer by phone
- `GET /:id` - Get customer by ID
- `PATCH /:id` - Update customer

### 5. PRODUCTS (`/api/products`)
- `POST /` - Create product
- `POST /upload-image` - Upload product image (Multer)
- `GET /` - Get all products
- `GET /products-with-latest-inventory` - Get products with inventory
- `GET /:id` - Get product by ID
- `PATCH /:id` - Update product
- `DELETE /:id` - Delete product

### 6. RELATIONS (`/api/relations`)
- `GET /worker-customers` - Get all worker-customer assignments
- `POST /assign-customer-to-worker` - Assign customer to worker (with sequence)
- `DELETE /worker-customer/:workerId/:customerId` - Remove assignment
- `GET /customer-products` - Get all customer-product subscriptions
- `POST /assign-product-to-customer` - Assign product to customer
- `PATCH /customer-product/:customerId/:productId` - Update quantity
- `DELETE /customer-product/:customerId/:productId` - Remove product from customer
- `GET /available-customers/:workerId` - Get unassigned customers
- `GET /available-products/:customerId` - Get unassigned products

### 7. INVENTORY (`/api/inventory`) - ADMIN ONLY
- `POST /update-all` - Calculate and store daily demand for all products
- `POST /received/:productId` - Update received quantity (admin input)
- `POST /remaining/:productId` - Update remaining quantity (end of day)
- `GET /` - Get inventory summary for date
- `GET /demand-all` - Get all product demands (calculates if needed)

### 8. DAILY ACTIVITY - WORKER INVENTORY (`/api/daily-activity-wi`) - WORKER
- `POST /pick-quantities` - Morning: Worker picks quantities
- `PUT /remaining-quantities` - Evening: Worker updates remaining
- `GET /worker/:workerId` - Get worker's daily activity
- `GET /summary/:workerId` - Get worker's daily summary stats
- `GET /history/:workerId` - Get activity history (last N days)

### 9. DAILY ACTIVITY - CUSTOMER INVENTORY (`/api/daily-activity-ci`) - WORKER
- `GET /my-customers` - Get worker's assigned customers (with sequence)
- `GET /my-inventory` - Get worker's inventory with product details
- `GET /my-inventory-summary` - Get worker's inventory summary

### 10. DELIVERIES (`/api/deliveries`) - WORKER
- `POST /process` - Process a delivery (creates CustomerInventory + PaymentReceived)
- `POST /total-amount` - Submit cash in hand amount
- `GET /total-amount` - Get today's cash in hand

### 11. VERIFICATION (`/api/verification`)
- `POST /submit` - Admin submits verification data (creates VerifiedDelivery records)

### 12. DATA VERIFICATION (`/api/data-verification`)
- `GET /overview` - Get daily deliveries overview (all workers, customers, products)
- `GET /cash-summary` - Get worker cash summary for date

---

## Data Flow Diagrams

### Daily Workflow

#### Morning (Admin):
1. Admin logs in via frontend
2. Admin sets received quantities: `POST /inventory/received/:productId`
3. Admin calculates demand: `POST /inventory/update-all` (sums up CustomerProduct quantities)

#### Morning (Worker):
1. Worker logs in via mobile app: `POST /auth/worker-login`
2. App fetches products: `GET /products/products-with-latest-inventory`
3. Worker enters picked quantities in MorningStockScreen
4. Worker submits: `POST /daily-activity-wi/pick-quantities`
   - Creates WorkerInventory records
   - Maps inventoryId → totalPickedQuantity

#### Delivery Time (Worker):
1. App loads customer list: `GET /daily-activity-ci/my-customers`
2. App loads worker inventory: `GET /daily-activity-ci/my-inventory`
3. Worker delivers to customers (CustomerDeliveryScreen)
4. For each delivery: `POST /deliveries/process`
   - Creates CustomerInventory record
   - Creates PaymentReceived record
   - Handles price customization logic

#### Evening (Worker):
1. Worker updates remaining stock: `PUT /daily-activity-wi/remaining-quantities`
2. Worker submits cash collected: `POST /deliveries/total-amount`

#### End of Day (Admin):
1. Admin enters remaining quantities: `POST /inventory/remaining/:productId`
2. Admin verifies data: `POST /verification/submit`
   - Creates VerifiedDelivery records
   - Updates CustomerInventory.verificationId
   - Updates CashInHand.actualAmount

---

## File-by-File Functionality

### Backend Core Files

#### `/backend/src/main.ts`
- Bootstraps NestJS application
- Configures CORS (allows all origins)
- Sets up global validation pipe
- Configures static file serving (`/uploads/`)
- Applies logging interceptor and exception filter

#### `/backend/src/app.module.ts`
- Root module importing:
  - ConfigModule (environment variables)
  - AuthModule
  - UsersModule
  - WorkersModule
  - CustomerModule
  - ProductModule
  - RelationModule
  - InventoryModule
  - DailyActivityModule

#### `/backend/src/prisma/prisma.service.ts`
- PrismaClient wrapper
- Handles database connection lifecycle

### Backend Module Files

#### Auth Module (`/backend/src/auth/`)
- **auth.controller.ts**: Exposes login endpoints
- **auth.service.ts**: 
  - Password hashing with bcrypt
  - JWT token generation
  - Token validation for both users and workers

#### Users Module (`/backend/src/users/`)
- **users.controller.ts**: Admin user CRUD (ADMIN only)
- **users.service.ts**: Creates/manages admin users only

#### Workers Module (`/backend/src/workers/`)
- **workers.controller.ts**: Worker CRUD (ADMIN only)
- **workers.service.ts**: Creates workers with phone-based auth

#### Customers Module (`/backend/src/customers/`)
- **customer.controller.ts**: Customer CRUD
- **customer.service.ts**: Manages customer data (no auth required for basic ops)

#### Products Module (`/backend/src/products/`)
- **product.controller.ts**: Product CRUD + image upload
- **product.service.ts**: 
  - Manages products (SANCHI/SABORO stores)
  - Image upload to `/uploads/products/`
  - Returns products with latest inventory

#### Relations Module (`/backend/src/relation/`)
- **relation.controller.ts**: Worker-Customer and Customer-Product assignments
- **relation.service.ts**:
  - Assigns customers to workers (with sequenceNumber for delivery order)
  - Assigns products to customers (with quantityAssociated)
  - Uses soft-delete pattern (thruDate instead of DELETE)

#### Inventory Module (`/backend/src/inventory/`)
- **inventory.controller.ts**: Admin inventory management
- **inventory-helper.ts**:
  - `calculateProductDemand()`: Sums CustomerProduct quantities for active subscriptions
  - `storeDailyDemand()`: Stores demands in ProductDemand table
  - `updateReceivedQuantity()`: Admin sets received stock
  - `updateRemainingQuantity()`: Admin sets end-of-day remaining
  - `getAllProductDemand()`: Returns demands (calculates if missing)

#### Daily Activity - Worker Inventory (`/backend/src/dailyactivity/daily-activity-wi.*`)
- **daily-activity-wi.controller.ts**: Worker inventory endpoints
- **daily-activity-wi.service.ts**:
  - `updatePickedQuantities()`: Morning - worker picks stock (creates WorkerInventory)
  - `updateRemainingQuantities()`: Evening - worker reports remaining
  - `getWorkerDailyActivity()`: Returns worker's day activities
  - `getWorkerDailySummary()`: Returns stats (picked, remaining, efficiency)

#### Daily Activity - Customer Inventory (`/backend/src/dailyactivity/daily-activity-ci.*`)
- **daily-activity-ci.controller.ts**: Customer delivery endpoints
- **daily-activity-ci.service.ts**:
  - `getWorkerCustomers()`: Returns assigned customers with sequence
  - `getWorkerInventoryWithProducts()`: Returns picked inventory with product details

#### Customer Delivery (`/backend/src/dailyactivity/customer-delivery.*`)
- **customer-delivery.controller.ts**: Delivery processing + cash management
- **customer-delivery.service.ts**:
  - `processDelivery()`: Creates CustomerInventory + PaymentReceived
    - If `isPriceCustomized=true` → payment collected immediately
    - Prevents duplicate deliveries (same customer+inventory+date)
  - Cash management: `addCashInHand()`, `getMyCashInHand()`

#### Verification (`/backend/src/dailyactivity/verification.*`)
- **verification.controller.ts**: Admin verification submission
- **verification.service.ts**:
  - `submitVerification()`: Creates VerifiedDelivery records
    - Uses single dailyVerificationId for all deliveries
    - Updates CustomerInventory.verificationId
    - Updates CashInHand.actualAmount

#### Data Verification (`/backend/src/dailyactivity/data-verification.*`)
- **data-verification.controller.ts**: Admin data viewing
- **data-verification.service.ts**:
  - `getDailyDeliveriesOverview()`: Joins all tables for complete delivery view
  - `getWorkerCashSummary()`: Returns worker cash data

---

## Frontend (Next.js) Architecture

### File Structure
```
frontend/src/app/
├── page.tsx              # Login page
├── dashboard/            # Admin dashboard
├── customers/             # Customer management
├── products/              # Product management
├── inventory/            # Inventory management
├── customer/customer-relations/  # Relations management
├── manage-users/         # User/Worker management
└── data-verification/     # Verification dashboard
```

### API Integration Files
- `/frontend/src/app/inventory/inventory.ts`: InventoryApiService
  - Methods: `getDemandAll()`, `getInventorySummary()`, `updateReceivedQuantity()`, etc.
- `/frontend/src/app/customer/customer.ts`: CustomerApiService
  - Methods: `getAllCustomers()`, `createCustomer()`, `updateCustomer()`

### Frontend API Base URL
Uses `process.env.NEXT_PUBLIC_API_URL` (configured per environment)

---

## Mobile App (React Native/Expo) Architecture

### File Structure
```
vitrann/app/
├── index.tsx                      # Login screen
├── MorningStockScreen.tsx         # Morning pick quantities
├── CustomerDeliveryScreen.tsx     # Delivery interface
├── ReturnedStocksScreen.tsx       # Evening remaining quantities
├── CashDetailsScreen.tsx          # Cash submission
├── DailySummaryScreen.tsx         # Daily summary view
└── CDS/ProductDeliveryModal.tsx   # Product delivery modal
```

### API Integration

#### Base Configuration
- API URL: `Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL`
- Default: `https://theinfranova.com/api`
- Token storage: AsyncStorage (`authToken`, `workerId`, `workerName`)

#### Screen-by-Screen API Calls

##### 1. Login Screen (`app/index.tsx`)
- `POST /auth/worker-login`
- Stores token, workerId, workerName in AsyncStorage
- Navigates to MorningStockScreen

##### 2. Morning Stock Screen (`app/MorningStockScreen.tsx`)
- `GET /products/products-with-latest-inventory` (on mount)
  - Filters products with valid inventory
  - Uses `inventoryId` as key for quantities
- `POST /daily-activity-wi/pick-quantities` (on submit)
  - Payload: `{ workerId, pickItems: [{ inventoryId, totalPickedQuantity }] }`
  - Navigates to CustomerDeliveryScreen

##### 3. Customer Delivery Screen (`app/CustomerDeliveryScreen.tsx`)
- `GET /daily-activity-ci/my-customers` (loads customer list)
  - Returns customers sorted by sequenceNumber
- `GET /daily-activity-ci/my-inventory` (loads picked inventory)
  - Returns WorkerInventory with product details
- `POST /deliveries/process` (for each delivery)
  - Payload: `{ customerId, inventoryId, deliveredQuantity, billAmount, isPriceCustomized }`
  - Handles duplicate prevention (backend)
  - Updates local state for confirmation

##### 4. Returned Stocks Screen (`app/ReturnedStocksScreen.tsx`)
- `GET /daily-activity-wi/worker/:workerId?date=...` (loads activity)
- `PUT /daily-activity-wi/remaining-quantities` (on submit)
  - Payload: `{ workerId, remainingItems: [{ inventoryId, remainingQuantity }] }`

##### 5. Cash Details Screen (`app/CashDetailsScreen.tsx`)
- `POST /deliveries/total-amount` (submit cash)
  - Payload: `{ amount: number }`
- `GET /deliveries/total-amount` (fetch existing)
  - Returns today's cash record

##### 6. Daily Summary Screen (`app/DailySummaryScreen.tsx`)
- `GET /daily-activity-wi/summary/:workerId` (inventory summary)
- `GET /deliveries/total-amount` (cash summary)

---

## Key Business Logic

### 1. Demand Calculation
**Location**: `/backend/src/inventory/inventory-helper.ts`

```typescript
calculateProductDemand(productId, date)
  → Sum all CustomerProduct.quantityAssociated where:
    - productId matches
    - thruDate is null OR > date (active subscription)
```

### 2. Worker Inventory Flow
1. **Morning**: Worker picks quantities → creates `WorkerInventory` with `totalPickedQuantity`
2. **Delivery**: Worker delivers → creates `CustomerInventory` records
3. **Evening**: Worker reports remaining → updates `WorkerInventory.remainingQuantity`
4. **Validation**: `remainingQuantity ≤ totalPickedQuantity`

### 3. Delivery Processing
**Location**: `/backend/src/dailyactivity/customer-delivery.service.ts`

Logic:
- If same `customerId + inventoryId + date` exists → skip (duplicate prevention)
- Always creates `CustomerInventory` and `PaymentReceived` records
- `isCollected = isPriceCustomized` (custom price = paid immediately)

### 4. Payment Collection Logic
- **Standard price**: `isCollected = false` (collected later)
- **Customized price**: `isCollected = true` (collected on delivery)

### 5. Verification System
**Location**: `/backend/src/dailyactivity/verification.service.ts`

- Admin submits verification data
- Single `verificationId` for all deliveries on a date
- Updates `CustomerInventory.verificationId`
- Updates `CashInHand.actualAmount` (verified amount)

### 6. Sequence-Based Customer Delivery
- Workers have customers assigned with `sequenceNumber`
- App sorts customers by `sequenceNumber` for delivery route
- Stored in `WorkerCustomer` table

---

## Database Relationships

### Key Foreign Keys:
- `WorkerCustomer.workerId` → `Worker.workerId`
- `WorkerCustomer.customerId` → `Customer.customerId`
- `CustomerProduct.customerId` → `Customer.customerId`
- `CustomerProduct.productId` → `Product.productId`
- `Inventory.productId` → `Product.productId`
- `WorkerInventory.workerId` → `Worker.workerId`
- `WorkerInventory.inventoryId` → `Inventory.inventoryId`
- `CustomerInventory.customerId` → `Customer.customerId`
- `CustomerInventory.inventoryId` → `Inventory.inventoryId`
- `PaymentReceived.customerId` → `Customer.customerId`
- `CashInHand.workerId` → `Worker.workerId`

### Unique Constraints:
- `User.email` (unique)
- `Worker.phoneNumber` (unique)
- `Customer.phoneNumber` (unique)
- `ProductDemand(productId, date)` (one demand per product per day)
- `Inventory(productId, date)` (one inventory record per product per day)
- `VerifiedDelivery(verificationId, workerId, customerId, inventoryId)` (composite unique)

---

## Environment Variables

### Backend (`.env`)
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: CORS allowed origin

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Mobile App (`eas.json`)
- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL (per build profile)

---

## Security Measures

1. **Password Hashing**: bcrypt with salt rounds=12
2. **JWT Authentication**: Bearer token in Authorization header
3. **Role-Based Access**: Guards prevent unauthorized access
4. **Input Validation**: class-validator DTOs
5. **CORS**: Configured per environment
6. **SQL Injection Protection**: Prisma ORM (parameterized queries)

---

## Error Handling

### Backend:
- Global exception filter: `/backend/src/common/http-exception.filter.ts`
- Logging interceptor: `/backend/src/common/logging.interceptor.ts`
- Standardized response format: `{ success, message, data }`

### Frontend/Mobile:
- Toast notifications for errors
- Try-catch blocks around API calls
- Loading states during API requests

---

## File Upload Handling

### Product Images:
- **Endpoint**: `POST /products/upload-image`
- **Storage**: `/backend/uploads/products/`
- **Library**: Multer
- **Validation**: JPEG/PNG/GIF, max 5MB
- **URL Format**: `/uploads/products/{timestamp}-{random}.{ext}`

---

## Testing Considerations

### API Endpoints:
- Most endpoints require authentication (JWT)
- Worker endpoints require WORKER role
- Admin endpoints require ADMIN role
- Date parameters use YYYY-MM-DD format

### Common Issues:
1. **Duplicate deliveries**: Prevented by backend check
2. **Missing inventory**: Worker must pick quantities before delivering
3. **Invalid quantities**: Remaining ≤ Picked (enforced)
4. **Token expiration**: 401 responses trigger re-login

---

## Deployment

### Backend:
- Runs on port (from env)
- Static files served from `/uploads/`
- Prisma migrations: `npm run prisma:migrate`

### Frontend:
- Next.js production build: `npm run build`
- Static assets + API proxy

### Mobile:
- Expo EAS Build
- Environment-specific API URLs in `eas.json`

---

## Summary

This system manages:
1. **Admin Dashboard**: Manages users, workers, customers, products, inventory, relations
2. **Worker Mobile App**: Morning stock picking → Customer deliveries → Evening returns → Cash submission
3. **Data Verification**: Admin verifies daily deliveries and cash collections

**Key Data Flow**:
Admin sets received quantities → Worker picks stock → Worker delivers to customers → Worker reports remaining → Admin verifies → Cycle repeats

All data is tracked with timestamps, verification IDs, and audit trails through the Prisma schema.

