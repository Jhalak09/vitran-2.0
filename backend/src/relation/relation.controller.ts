// relation.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { RelationService } from './relation.service';

export interface AssignCustomerToWorkerDto {
  workerId: number;
  customerId: number;
  fromDate?: string;
}

export interface AssignProductToCustomerDto {
  customerId: number;
  productId: number;
  fromDate?: string;
  thruDate?: string; // ✅ Add optional thruDate
  quantityAssociated?: number;
}

@Controller('relations')
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  // Worker-Customer Relations
  @Get('worker-customers')
  async getWorkerCustomerRelations() {
    try {
      const relations = await this.relationService.getWorkerCustomerRelations();
      return { success: true, message: 'Worker-customer relations retrieved successfully', data: relations };
    } catch (error) {
      return { success: false, message: 'Failed to fetch relations', data: [] };
    }
  }

  @Post('assign-customer-to-worker')
  @HttpCode(HttpStatus.CREATED)
  async assignCustomerToWorker(@Body() assignDto: AssignCustomerToWorkerDto) {
    try {
      const relation = await this.relationService.assignCustomerToWorker(assignDto);
      return { success: true, message: 'Customer assigned to worker successfully', data: relation };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to assign customer to worker', data: null };
    }
  }

  @Delete('worker-customer/:workerId/:customerId')
  async removeCustomerFromWorker(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    try {
      await this.relationService.removeCustomerFromWorker(workerId, customerId);
      return { success: true, message: 'Customer removed from worker successfully' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove customer from worker' };
    }
  }

  // Customer-Product Relations
  @Get('customer-products')
  async getCustomerProductRelations() {
    try {
      const relations = await this.relationService.getCustomerProductRelations();
      return { success: true, message: 'Customer-product relations retrieved successfully', data: relations };
    } catch (error) {
      return { success: false, message: 'Failed to fetch relations', data: [] };
    }
  }

  @Post('assign-product-to-customer')
  @HttpCode(HttpStatus.CREATED)
  async assignProductToCustomer(@Body() assignDto: AssignProductToCustomerDto) {
    try {
      const relation = await this.relationService.assignProductToCustomer(assignDto);
      return { success: true, message: 'Product assigned to customer successfully', data: relation };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to assign product to customer', data: null };
    }
  }

  @Patch('customer-product/:customerId/:productId')
  async updateCustomerProductQuantity(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateDto: { quantityAssociated: number },
  ) {
    try {
      const relation = await this.relationService.updateCustomerProductQuantity(
        customerId,
        productId,
        updateDto.quantityAssociated,
      );
      return { success: true, message: 'Quantity updated successfully', data: relation };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update quantity', data: null };
    }
  }

  @Delete('customer-product/:customerId/:productId')
  async removeProductFromCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    try {
      await this.relationService.removeProductFromCustomer(customerId, productId);
      return { success: true, message: 'Product removed from customer successfully' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove product from customer' };
    }
  }

  // Helper endpoints for dropdowns
  @Get('available-customers/:workerId')
  async getAvailableCustomersForWorker(@Param('workerId', ParseIntPipe) workerId: number) {
    try {
      const customers = await this.relationService.getAvailableCustomersForWorker(workerId);
      return { success: true, data: customers };
    } catch (error) {
      return { success: false, message: 'Failed to fetch available customers', data: [] };
    }
  }

  @Get('available-products/:customerId')
  async getAvailableProductsForCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    try {
      const products = await this.relationService.getAvailableProductsForCustomer(customerId);
      return { success: true, data: products };
    } catch (error) {
      return { success: false, message: 'Failed to fetch available products', data: [] };
    }
  }
}
