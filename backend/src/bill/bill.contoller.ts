import { Controller, Post, Get, Patch, Delete, Body, Query, Param, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { BillService } from './bill.service';
import * as fs from 'fs';
import * as path from 'path';

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
      // First try to serve stored file
      try {
        const { buffer, fileName } = await this.billService.downloadStoredBill(parseInt(billId));
        
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length.toString(),
        });
        
        res.send(buffer);
        return;
      } catch (fileError) {
        console.warn(`Stored file not found for bill ${billId}, generating new PDF`);
      }

      // Fallback: Generate PDF on-the-fly
      const pdfBuffer = await this.billService.generateBillPDF(parseInt(billId));
      const bill = await this.billService.getBillDetails(parseInt(billId));
      
      const startDate = new Date(bill.startDate);
      const endDate = new Date(bill.endDate);
      const customerName = `${bill.customer.firstName}_${bill.customer.lastName || ''}`.replace(/\s+/g, '_');
      const monthYear = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).replace(' ', '_');
      const dateRange = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}_to_${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`;
      
      const filename = `${customerName}_${monthYear}_${dateRange}.pdf`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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

  @Get('serve/:billId')
  async serveBillPDF(@Param('billId') billId: string, @Res() res: Response) {
    try {
      const { buffer, fileName } = await this.billService.downloadStoredBill(parseInt(billId));
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`, // inline for preview
      });
      
      res.send(buffer);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Bill file not found'
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

  @Delete(':billId/file')
  async deleteBillFile(@Param('billId') billId: string) {
    try {
      const bill = await this.billService.getBillDetails(parseInt(billId));
      
      if (bill.filePath && fs.existsSync(path.join(process.cwd(), bill.filePath))) {
        fs.unlinkSync(path.join(process.cwd(), bill.filePath));
        
        // Clear file path from database
        await this.billService.clearBillFilePath(parseInt(billId));
      }

      return {
        success: true,
        message: 'Bill file deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete bill file'
      };
    }
  }
}
