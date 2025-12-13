-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'WORKER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CustomerClassification" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "store" AS ENUM ('SANCHI', 'SABORO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "customerId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "city" TEXT,
    "pincode" TEXT,
    "classification" "CustomerClassification" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "Worker" (
    "workerId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("workerId")
);

-- CreateTable
CREATE TABLE "Product" (
    "productId" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "currentProductPrice" DECIMAL(10,2) NOT NULL,
    "lastProductPrice" DECIMAL(10,2),
    "imageUrl" TEXT,
    "description" TEXT,
    "storeId" "store" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "WorkerCustomer" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "thruDate" TIMESTAMP(3),

    CONSTRAINT "WorkerCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDemand" (
    "demandId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "totalDemand" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDemand_pkey" PRIMARY KEY ("demandId")
);

-- CreateTable
CREATE TABLE "CustomerProduct" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "thruDate" TIMESTAMP(3),
    "quantityAssociated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "inventoryId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "receivedQuantity" INTEGER,
    "remainingQuantity" INTEGER,
    "entryByUserLoginId" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("inventoryId")
);

-- CreateTable
CREATE TABLE "WorkerInventory" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "totalPickedQuantity" INTEGER,
    "remainingQuantity" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInventory" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "deliveredQuantity" INTEGER NOT NULL,
    "workerId" INTEGER,
    "verificationId" INTEGER,

    CONSTRAINT "CustomerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceived" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "bill" DECIMAL(10,2) NOT NULL,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerId" INTEGER,

    CONSTRAINT "PaymentReceived_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashInHand" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "actualAmount" INTEGER,

    CONSTRAINT "CashInHand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedDelivery" (
    "verificationId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "deliveredQuantity" INTEGER NOT NULL,
    "bill" DECIMAL(10,2) NOT NULL,
    "isCollected" BOOLEAN NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT NOT NULL,

    CONSTRAINT "VerifiedDelivery_pkey" PRIMARY KEY ("verificationId","workerId","customerId","inventoryId")
);

-- CreateTable
CREATE TABLE "Bill" (
    "billId" SERIAL NOT NULL,
    "billNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "deliveryCharges" DECIMAL(10,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "filePath" TEXT,
    "fileName" TEXT,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("billId")
);

-- CreateTable
CREATE TABLE "deliverycharge" (
    "id" SERIAL NOT NULL,
    "charge" INTEGER NOT NULL,

    CONSTRAINT "deliverycharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneNumber_key" ON "Customer"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_phoneNumber_key" ON "Worker"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDemand_productId_date_key" ON "ProductDemand"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_date_key" ON "Inventory"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedDelivery_workerId_customerId_inventoryId_verificati_key" ON "VerifiedDelivery"("workerId", "customerId", "inventoryId", "verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- AddForeignKey
ALTER TABLE "WorkerCustomer" ADD CONSTRAINT "WorkerCustomer_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("workerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCustomer" ADD CONSTRAINT "WorkerCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDemand" ADD CONSTRAINT "ProductDemand_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProduct" ADD CONSTRAINT "CustomerProduct_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProduct" ADD CONSTRAINT "CustomerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerInventory" ADD CONSTRAINT "WorkerInventory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("workerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInventory" ADD CONSTRAINT "CustomerInventory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceived" ADD CONSTRAINT "PaymentReceived_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashInHand" ADD CONSTRAINT "CashInHand_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("workerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;
