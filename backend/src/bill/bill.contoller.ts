import { Controller, Post, Get, Patch, Body, Query, Param, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { BillService } from './bill.service';

@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateBill(@Body() body: {
    customerId: number;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: boolean;
    createdBy: string;
  }) {
    try {
      const result = await this.billService.generateBill(body);
      return {
        success: true,
        message: 'Bill generated successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate bill',
        data: null
      };
    }
  }

  @Get('download/:billId')
  async downloadBillPDF(@Param('billId') billId: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.billService.generateBillPDF(parseInt(billId));
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill-${billId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to generate PDF'
      });
    }
  }

  @Get('customer/:customerId')
  @HttpCode(HttpStatus.OK)
  async getCustomerBills(@Param('customerId') customerId: string) {
    try {
      const result = await this.billService.getCustomerBills(parseInt(customerId));
      return {
        success: true,
        message: 'Customer bills retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get customer bills',
        data: null
      };
    }
  }

  @Patch(':billId/mark-paid')
  @HttpCode(HttpStatus.OK)
  async markBillAsPaid(@Param('billId') billId: string) {
    try {
      const result = await this.billService.markBillAsPaid(parseInt(billId));
      return {
        success: true,
        message: 'Bill marked as paid successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to mark bill as paid',
        data: null
      };
    }
  }

  @Get('preview')
  @HttpCode(HttpStatus.OK)
  async previewBill(@Query() query: {
    customerId: string;
    startDate: string;
    endDate: string;
    includeDeliveryCharges: string;
  }) {
    try {
      const result = await this.billService.previewBill({
        customerId: parseInt(query.customerId),
        startDate: query.startDate,
        endDate: query.endDate,
        includeDeliveryCharges: query.includeDeliveryCharges === 'true'
      });
      return {
        success: true,
        message: 'Bill preview generated successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to preview bill',
        data: null
      };
    }
  }
}
