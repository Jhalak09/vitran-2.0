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
      where: {
        customerId: { not: null }, // Only show assigned relations
      },
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
    const { workerId, customerId, fromDate } = assignDto;

    // Check if assignment already exists
    const existing = await this.prisma.workerCustomer.findUnique({
      where: {
        workerId_customerId: {
          workerId,
          customerId,
        },
      },
    });

    if (existing && existing.customerId !== null) {
      throw new ConflictException('Customer is already assigned to this worker');
    }

    // Update existing null entry or create new one
    if (existing && existing.customerId === null) {
      return this.prisma.workerCustomer.update({
        where: { id: existing.id },
        data: {
          customerId,
          fromDate: fromDate ? new Date(fromDate) : new Date(),
          thruDate: null,
        },
        include: {
          worker: true,
          customer: true,
        },
      });
    } else {
      return this.prisma.workerCustomer.create({
        data: {
          workerId,
          customerId,
          fromDate: fromDate ? new Date(fromDate) : new Date(),
          thruDate: null,
        },
        include: {
          worker: true,
          customer: true,
        },
      });
    }
  }

  async removeCustomerFromWorker(workerId: number, customerId: number) {
    const relation = await this.prisma.workerCustomer.findUnique({
        where: {
        workerId_customerId: {
            workerId,
            customerId,
        },
        },
    });

    if (!relation) {
        throw new NotFoundException('Worker-customer relation not found');
    }

    // ✅ DELETE the relation permanently
    return this.prisma.workerCustomer.delete({
        where: { id: relation.id },
    });
    }


  // Customer-Product Relations
  async getCustomerProductRelations() {
    return this.prisma.customerProduct.findMany({
      where: {
        productId: { not: null }, // Only show assigned relations
      },
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
  const { customerId, productId, fromDate, thruDate, quantityAssociated = 1 } = assignDto;

  // ✅ Check if assignment already exists
  const existing = await this.prisma.customerProduct.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
  });

  if (existing && existing.productId !== null) {
    throw new ConflictException('Product is already assigned to this customer');
  }

  // ✅ Use transaction for relation operations
  const result = await this.prisma.$transaction(async (prisma) => {
    let relation;

    // Update existing null entry or create new one
    if (existing && existing.productId === null) {
      relation = await prisma.customerProduct.update({
        where: { id: existing.id },
        data: {
          productId,
          fromDate: fromDate ? new Date(fromDate) : new Date(),
          thruDate: thruDate ? new Date(thruDate) : null,
          quantityAssociated,
        },
        include: { customer: true, product: true },
      });
    } else {
      relation = await prisma.customerProduct.create({
        data: {
          customerId,
          productId,
          fromDate: fromDate ? new Date(fromDate) : new Date(),
          thruDate: thruDate ? new Date(thruDate) : null,
          quantityAssociated,
        },
        include: { customer: true, product: true },
      });
    }

    return relation;
  });

  // ✅ FIXED: Update inventory with correct parameter order (productId, date, userId)
  if (productId) {
    try {
      await this.inventoryHelper.updateProductInventory(productId, undefined, 'system');
      console.log(`✅ Inventory updated for product ${productId} after customer assignment`);
    } catch (inventoryError) {
      console.error(`❌ Failed to update inventory for product ${productId}:`, inventoryError);
      // Log the error but don't fail the whole operation since the relation was created successfully
    }
  }

  return result;
}



async updateCustomerProductQuantity(customerId: number, productId: number, quantityAssociated: number) {
  const relation = await this.prisma.customerProduct.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
  });

  if (!relation) {
    throw new NotFoundException('Customer-product relation not found');
  }

  // ✅ Use transaction to ensure both relation update and inventory recalculation
  const result = await this.prisma.$transaction(async (prisma) => {
    const updatedRelation = await prisma.customerProduct.update({
      where: { id: relation.id },
      data: { quantityAssociated },
      include: {
        customer: true,
        product: true,
      },
    });

    return updatedRelation;
  });

  // ✅ FIXED: Update inventory with correct parameter order (productId, date, userId)
  try {
    await this.inventoryHelper.updateProductInventory(productId, undefined, 'system');
    console.log(`✅ Inventory updated for product ${productId} after quantity change: ${relation.quantityAssociated} → ${quantityAssociated}`);
  } catch (inventoryError) {
    console.error(`❌ Failed to update inventory for product ${productId}:`, inventoryError);
    // Log error but don't fail the operation since the relation was updated successfully
  }

  return result;
}


async removeProductFromCustomer(customerId: number, productId: number) {
  const relation = await this.prisma.customerProduct.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
  });

  if (!relation) {
    throw new NotFoundException('Customer-product relation not found');
  }

  // ✅ Use transaction to ensure atomic operation
  const result = await this.prisma.$transaction(async (prisma) => {
    // DELETE the relation permanently
    const deletedRelation = await prisma.customerProduct.delete({
      where: { id: relation.id },
    });

    return deletedRelation;
  });

  // ✅ FIXED: Update inventory with correct parameter order (productId, date, userId)
  try {
    await this.inventoryHelper.updateProductInventory(productId, undefined, 'system');
    console.log(`✅ Inventory updated for product ${productId} after customer removal (quantity was: ${relation.quantityAssociated})`);
  } catch (inventoryError) {
    console.error(`❌ Failed to update inventory for product ${productId}:`, inventoryError);
    // Log error but don't fail the operation since the relation was deleted successfully
  }

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
