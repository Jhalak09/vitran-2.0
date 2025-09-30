// relation.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryHelper } from '../inventory/inventory-helper';

@Injectable()
export class RelationService {
  constructor(private prisma: PrismaService,
                private inventoryHelper: InventoryHelper
  ) {}

  // Worker-Customer Relations
  async getWorkerCustomerRelations() {
    return this.prisma.workerCustomer.findMany({
      
      include: {
        worker: {
          select: {
            workerId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
          },
        },
        customer: {
          select: {
            customerId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            city: true,
            classification: true,
          },
        },
      },
      orderBy: { fromDate: 'desc' },
    });
  }

async assignCustomerToWorker(assignDto: any) {
  const { workerId, customerId, sequenceNumber } = assignDto;

  // Check if there's an existing relation for this worker-customer pair
  const existing = await this.prisma.workerCustomer.findFirst({
    where:  { workerId, customerId } ,
  });

  // Only block if there's an ACTIVE assignment (no thruDate)
  if (existing && existing.thruDate === null) {
    throw new ConflictException('Customer is already actively assigned to this worker');
  }

  const now = new Date();


  return this.prisma.workerCustomer.create({
    data: { 
      workerId, 
      customerId, 
      fromDate: now, 
      thruDate: null, 
      sequenceNumber 
    },
    include: { worker: true, customer: true },
  });
}

async removeCustomerFromWorker(workerId: number, customerId: number) {
  // Find the latest active relation (no thruDate) for this worker-customer pair
  const relation = await this.prisma.workerCustomer.findFirst({
    where: {
      workerId,
      customerId,
      thruDate: null, // Only find active relations
    },
    orderBy: {
      fromDate: 'desc', // Get the most recent one if multiple exist
    },
  });

  if (!relation) {
    throw new NotFoundException('Active worker-customer relation not found');
  }

  const now = new Date();

  // Update thruDate to mark relation ended
  return this.prisma.workerCustomer.update({
    where: { id: relation.id },
    data: {
      thruDate: now,
    },
  });
}

  // Customer-Product Relations
  async getCustomerProductRelations() {
    return this.prisma.customerProduct.findMany({
      include: {
        customer: {
          select: {
            customerId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            city: true,
            classification: true,
          },
        },
        product: {
          select: {
            productId: true,
            productName: true,
            currentProductPrice: true,
            storeId: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { fromDate: 'desc' },
    });
  }

async assignProductToCustomer(assignDto: any) {
  const { customerId, productId, quantityAssociated = 1 } = assignDto;

  // Check if there's an active relation (thruDate is null) between customer and product
  const activeRelation = await this.prisma.customerProduct.findFirst({
    where: {
      customerId,
      productId,
      thruDate: null, // Only check for active relations
    },
  });

  if (activeRelation) {
    throw new ConflictException('Product is already actively assigned to this customer');
  }

  const now = new Date();

  // Use transaction for relation operations
  const result = await this.prisma.$transaction(async (prisma) => {
    // Always create a new relation (preserves historical data)
    const relation = await prisma.customerProduct.create({
      data: {
        customerId,
        productId,
        fromDate: now,
        thruDate: null, // New relation is always active
        quantityAssociated,
      },
      include: { customer: true, product: true },
    });

    return relation;
  });

  // Update inventory if productId exists

  return result;
}



async updateCustomerProductQuantity(customerId: number, productId: number, quantityAssociated: number) {
  // Find the active relation (thruDate is null) for this customer-product pair
  const activeRelation = await this.prisma.customerProduct.findFirst({
    where: {
      customerId,
      productId,
      thruDate: null, // Only find active relations
    },
    orderBy: {
      fromDate: 'desc', // Get the most recent one if multiple exist
    },
  });

  if (!activeRelation) {
    throw new NotFoundException('Active customer-product relation not found');
  }
  // Use transaction to ensure both relation update and inventory recalculation
  const result = await this.prisma.$transaction(async (prisma) => {
    const updatedRelation = await prisma.customerProduct.update({
      where: { id: activeRelation.id },
      data: { quantityAssociated },
      include: {
        customer: true,
        product: true,
      },
    });

    return updatedRelation;
  });
  
  return result;
}

async removeProductFromCustomer(customerId: number, productId: number) {
  // Find the active relation (thruDate is null) for this customer-product pair
  const activeRelation = await this.prisma.customerProduct.findFirst({
    where: {
      customerId,
      productId,
      thruDate: null, // Only find active relations
    },
    orderBy: {
      fromDate: 'desc', // Get the most recent one if multiple exist
    },
  });

  if (!activeRelation) {
    throw new NotFoundException('Active customer-product relation not found');
  }

  const now = new Date();

  // Use transaction to ensure atomic operation
  const result = await this.prisma.$transaction(async (prisma) => {
    // Update thruDate to mark relation as ended instead of deleting
    const updatedRelation = await prisma.customerProduct.update({
      where: { id: activeRelation.id },
      data: {
        thruDate: now,
      },
      include: {
        customer: true,
        product: true,
      },
    });

    return updatedRelation;
  });

  // Update inventory with correct parameter order (productId, date, userId)

  return result;
}


  // Helper methods for dropdowns
  async getAvailableCustomersForWorker(workerId: number) {
    const assignedCustomers = await this.prisma.workerCustomer.findMany({
      where: {
        workerId,
        customerId: { not: null },
        thruDate: null, // Only active assignments
      },
      select: { customerId: true },
    });

    const assignedCustomerIds = assignedCustomers.map(wc => wc.customerId);

    return this.prisma.customer.findMany({
      where: {
        customerId: {
          notIn: assignedCustomerIds,
        },
      },
      select: {
        customerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        city: true,
        classification: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getAvailableProductsForCustomer(customerId: number) {
    const assignedProducts = await this.prisma.customerProduct.findMany({
      where: {
        customerId,
        productId: { not: null },
        thruDate: null, // Only active assignments
      },
      select: { productId: true },
    });

    const assignedProductIds = assignedProducts.map(cp => cp.productId);

    return this.prisma.product.findMany({
      where: {
        productId: {
          notIn: assignedProductIds,
        },
      },
      select: {
        productId: true,
        productName: true,
        currentProductPrice: true,
        storeId: true,
        imageUrl: true,
        description: true,
      },
      orderBy: { productName: 'asc' },
    });
  }
}
