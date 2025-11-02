# Vitran Daily Workflow - Complete Sequence

This document outlines the exact sequence of operations for a typical day in the Vitran system.

---

## Morning Phase (6:00 AM - 8:00 AM)

### Admin Tasks

#### Step 1: Set Received Quantities
**Action**: Admin enters quantities received from suppliers

**API Calls**:
```javascript
// For each product that arrived today
POST /api/inventory/received/{productId}
Body: { receivedQuantity: 100, userId: "admin@example.com" }
```

**What Happens**:
- Creates/updates `Inventory` record for today
- Sets `receivedQuantity` and `entryByUserLoginId`
- This inventory is now available for workers to pick

#### Step 2: Calculate Daily Demand
**Action**: Admin calculates total demand based on customer subscriptions

**API Call**:
```javascript
POST /api/inventory/update-all
Body: { userId: "admin@example.com", date: "2024-01-15" }
```

**What Happens**:
- For each product, sums up `CustomerProduct.quantityAssociated` where:
  - `productId` matches
  - Subscription is active (`thruDate` is null or future)
- Stores result in `ProductDemand` table
- Creates one `ProductDemand` record per product per day

**Example Calculation**:
- Customer A subscribes to 10 units of Product X
- Customer B subscribes to 5 units of Product X
- Customer C subscribes to 8 units of Product X
- **Total Demand for Product X = 23 units**

---

### Worker Tasks

#### Step 3: Worker Login
**Action**: Worker logs into mobile app

**API Call**:
```javascript
POST /api/auth/worker-login
Body: { phoneNumber: "9876543210", password: "password123" }
```

**Response**:
- Returns JWT token
- Returns worker info: `{ workerId, firstName, lastName, phoneNumber, role, isActive }`
- App stores token in AsyncStorage

#### Step 4: Load Products for Picking
**Action**: Worker views available products with inventory

**API Call**:
```javascript
GET /api/products/products-with-latest-inventory
Headers: { Authorization: "Bearer {token}" }
```

**Response**:
- Returns products with their latest `Inventory` records
- Only products with `inventoryId` are shown (has received quantity)

**Screen**: `MorningStockScreen.tsx`

#### Step 5: Worker Picks Quantities
**Action**: Worker enters quantities to pick for each product

**User Input**: Worker enters numbers (e.g., 50 packets, 30 packets)

**API Call**:
```javascript
POST /api/daily-activity-wi/pick-quantities
Headers: { Authorization: "Bearer {token}" }
Body: {
  workerId: 5,
  pickItems: [
    { inventoryId: 101, totalPickedQuantity: 50 },
    { inventoryId: 102, totalPickedQuantity: 30 }
  ]
}
```

**What Happens**:
- Creates `WorkerInventory` records
- One record per `inventoryId`
- Sets `totalPickedQuantity` and `date`
- Links to worker via `workerId`

**Screen**: `MorningStockScreen.tsx` → navigates to `CustomerDeliveryScreen.tsx`

---

## Delivery Phase (8:00 AM - 5:00 PM)

### Worker Tasks

#### Step 6: Load Customer List
**Action**: App loads worker's assigned customers

**API Call**:
```javascript
GET /api/daily-activity-ci/my-customers
Headers: { Authorization: "Bearer {token}" }
```

**Response**:
- Returns customers assigned to logged-in worker
- Includes `sequenceNumber` (delivery route order)
- Sorted by `sequenceNumber` in app

**Screen**: `CustomerDeliveryScreen.tsx`

#### Step 7: Load Worker Inventory
**Action**: App loads picked inventory with product details

**API Call**:
```javascript
GET /api/daily-activity-ci/my-inventory
Headers: { Authorization: "Bearer {token}" }
Query: ?date=2024-01-15
```

**Response**:
- Returns `WorkerInventory` records for today
- Includes full product details (name, price, image)
- Shows what worker picked in morning

**Screen**: `CustomerDeliveryScreen.tsx`

#### Step 8: Process Deliveries
**Action**: Worker delivers products to customers (one by one)

**For Each Customer Delivery**:

**API Call**:
```javascript
POST /api/deliveries/process
Headers: { Authorization: "Bearer {token}" }
Body: {
  customerId: 10,
  inventoryId: 101,
  deliveredQuantity: 5,
  billAmount: 250,
  isPriceCustomized: false
}
```

**What Happens**:
1. **Duplicate Check**: Verifies no existing `CustomerInventory` for same `customerId + inventoryId + date`
2. **If duplicate**: Returns `{ skipped: true }` - no new record created
3. **If new**:
   - Creates `CustomerInventory` record:
     - `customerId`: 10
     - `inventoryId`: 101
     - `deliveredQuantity`: 5
     - `userLogin`: worker's phone number
     - `date`: today
   - Creates `PaymentReceived` record:
     - `customerId`: 10
     - `inventoryId`: 101
     - `bill`: 250
     - `isCollected`: false (if `isPriceCustomized=false`)
     - `date`: today

**Price Customization Logic**:
- If `isPriceCustomized = true`: `isCollected = true` (payment collected immediately)
- If `isPriceCustomized = false`: `isCollected = false` (payment pending)

**Screen**: `CustomerDeliveryScreen.tsx` → Shows confirmation toast

---

## Evening Phase (5:00 PM - 7:00 PM)

### Worker Tasks

#### Step 9: Report Remaining Stock
**Action**: Worker reports quantities not delivered (returned stock)

**API Call**:
```javascript
PUT /api/daily-activity-wi/remaining-quantities
Headers: { Authorization: "Bearer {token}" }
Body: {
  workerId: 5,
  remainingItems: [
    { inventoryId: 101, remainingQuantity: 10 },
    { inventoryId: 102, remainingQuantity: 5 }
  ]
}
```

**Validation**:
- Ensures `remainingQuantity ≤ totalPickedQuantity` for each item
- Must have existing `WorkerInventory` record (from morning pick)

**What Happens**:
- Updates `WorkerInventory.remainingQuantity`
- Tracks what was returned vs. delivered

**Screen**: `ReturnedStocksScreen.tsx`

#### Step 10: Submit Cash Collected
**Action**: Worker submits total cash collected during day

**API Call**:
```javascript
POST /api/deliveries/total-amount
Headers: { Authorization: "Bearer {token}" }
Body: { amount: 5000 }
```

**What Happens**:
- Checks if `CashInHand` record exists for today
- If exists: Returns error (already submitted)
- If new: Creates `CashInHand` record:
  - `workerId`: 5
  - `amount`: 5000 (worker-reported amount)
  - `actualAmount`: null (will be set by admin during verification)
  - `date`: today

**Screen**: `CashDetailsScreen.tsx`

---

## End of Day - Admin Verification (7:00 PM - 9:00 PM)

### Admin Tasks

#### Step 11: Enter Remaining Quantities (Per Product)
**Action**: Admin verifies and enters actual remaining stock in warehouse

**API Call**:
```javascript
POST /api/inventory/remaining/{productId}
Headers: { Authorization: "Bearer {token}" }
Body: { remainingQuantity: 50, userId: "admin@example.com" }
```

**What Happens**:
- Updates `Inventory.remainingQuantity` for today
- This is the actual remaining stock in warehouse (sum of all workers' returns)

#### Step 12: View Delivery Overview
**Action**: Admin reviews all deliveries for verification

**API Call**:
```javascript
GET /api/data-verification/overview?date=2024-01-15
```

**Response**:
- Returns complete delivery data:
  - Worker info
  - Customer info
  - Product details
  - Delivered quantities
  - Bill amounts
  - Collection status
  - Verification ID (if already verified)

**Screen**: Frontend `data-verification/page.tsx`

#### Step 13: View Cash Summary
**Action**: Admin reviews worker cash submissions

**API Call**:
```javascript
GET /api/data-verification/cash-summary?date=2024-01-15
```

**Response**:
- Returns cash data per worker:
  - `workerId`, `workerName`, `cashCollected` (amount reported by worker)

**Screen**: Frontend `data-verification/page.tsx`

#### Step 14: Submit Verification
**Action**: Admin verifies all deliveries and cash

**API Call**:
```javascript
POST /api/verification/submit
Body: {
  deliveries: [
    {
      workerId: 5,
      customerId: 10,
      inventoryId: 101,
      productName: "Whole Milk",
      deliveredQuantity: 5,
      bill: 250,
      isCollected: false
    },
    // ... more deliveries
  ],
  cashData: [
    { workerId: 5, actualAmount: 4800 }
  ],
  verifiedBy: "admin@example.com"
}
```

**What Happens**:
1. **Generate Verification ID**: 
   - Checks if verification exists for today
   - If exists: Uses existing `verificationId`
   - If new: Generates new `verificationId` (last 8 digits of timestamp)

2. **Create VerifiedDelivery Records**:
   - One record per delivery
   - All share the same `verificationId`
   - Contains: worker, customer, inventory, product, quantity, bill, collection status

3. **Update CustomerInventory**:
   - Sets `verificationId` on all `CustomerInventory` records matching the deliveries

4. **Update CashInHand**:
   - Sets `actualAmount` (verified amount) on `CashInHand` records
   - Worker reported: `amount = 5000`
   - Admin verified: `actualAmount = 4800` (shortage of 200)

**Result**:
- All deliveries marked as verified
- Cash discrepancies recorded
- Complete audit trail created

**Screen**: Frontend `data-verification/page.tsx`

---

## Data Flow Summary

```
MORNING:
Admin → Inventory.receivedQuantity (100 units)
      → ProductDemand.totalDemand (80 units calculated)

Worker → WorkerInventory.totalPickedQuantity (50 units picked)

DELIVERY:
Worker → CustomerInventory.deliveredQuantity (5 units to Customer A)
      → CustomerInventory.deliveredQuantity (3 units to Customer B)
      → PaymentReceived.bill (total bills created)

EVENING:
Worker → WorkerInventory.remainingQuantity (42 units remaining)
      → CashInHand.amount (5000 reported)

VERIFICATION:
Admin → Inventory.remainingQuantity (actual warehouse stock)
      → VerifiedDelivery (all deliveries verified)
      → CashInHand.actualAmount (4800 verified)
```

---

## Key Database Tables and Their Roles

### Morning Phase:
- **Inventory**: Stores received quantities (admin input)
- **ProductDemand**: Stores calculated demand (sum of subscriptions)
- **WorkerInventory**: Stores picked quantities (worker input)

### Delivery Phase:
- **CustomerInventory**: Records what was delivered to whom
- **PaymentReceived**: Records payment details (bill, collected status)

### Evening Phase:
- **WorkerInventory**: Updated with remaining quantities
- **CashInHand**: Records worker-reported cash amount

### Verification Phase:
- **VerifiedDelivery**: Permanent verification records
- **CustomerInventory**: Updated with verificationId
- **CashInHand**: Updated with actualAmount (verified)

---

## Important Validations

1. **Duplicate Delivery Prevention**:
   - Same `customerId + inventoryId + date` = skipped
   - Prevents accidental double entries

2. **Quantity Validation**:
   - `remainingQuantity ≤ totalPickedQuantity`
   - Prevents reporting more remaining than picked

3. **Cash Validation**:
   - Only one `CashInHand` record per worker per day
   - Prevents duplicate cash submissions

4. **Active Relations**:
   - Only active `WorkerCustomer` (thruDate is null) are shown
   - Only active `CustomerProduct` (thruDate is null) count toward demand

---

## Error Scenarios

### Scenario 1: Worker tries to deliver without picking stock
- **Error**: No `WorkerInventory` record exists
- **Solution**: Worker must pick quantities first in morning

### Scenario 2: Worker reports more remaining than picked
- **Error**: Validation fails
- **Solution**: Correct the remaining quantity

### Scenario 3: Admin tries to verify same day twice
- **Result**: Updates existing verification records (upsert)

### Scenario 4: Worker tries to submit duplicate delivery
- **Result**: Backend detects duplicate and skips (returns `isDuplicate: true`)

---

## Daily Cycle Completion

At the end of the day:
1. ✅ All received quantities entered
2. ✅ All demands calculated
3. ✅ All workers picked stock
4. ✅ All deliveries recorded
5. ✅ All remaining stock reported
6. ✅ All cash submitted
7. ✅ All data verified by admin

**Next Day**: Cycle repeats with new date, new inventory records, new demand calculations.

