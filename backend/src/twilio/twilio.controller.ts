import { Controller, Post, Body, Param, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { BillService } from '../bill/bill.service';

@Controller('twilio')
export class TwilioController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly billService: BillService
  ) {}

@Post('send-bill/:billId')
@HttpCode(HttpStatus.OK)
async sendBillViaWhatsApp(@Param('billId') billId: string) {
  try {
    // Get bill details with customer information
    const bill = await this.billService.getBillDetails(parseInt(billId));
    
    if (!bill) {
      return {
        success: false,
        message: 'Bill not found'
      };
    }

    if (!bill.customer.phoneNumber) {
      return {
        success: false,
        message: 'Customer phone number not found'
      };
    }

    // Check if bill PDF exists, if not generate it
    let pdfUrl: string;
    
    if (bill.filePath) {
      // Convert file path to public URL (Backend serves files on port 4000)
      const baseUrl = process.env.BASE_URL 
      pdfUrl = `${baseUrl}/${bill.filePath}`;
    // pdfUrl = `${baseUrl}/bills/serve/${billId}`;
      console.log('PDF URL:', pdfUrl);

      
    } else {
      return {
        success: false,
        message: 'Bill PDF not found. Please generate the bill first.'
      };
    }

    // Calculate due date (30 days from bill creation)
    const dueDate = new Date(bill.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);

    // Send WhatsApp message
    const result = await this.twilioService.sendBillViaWhatsApp({
      phoneNumber: bill.customer.phoneNumber,
      customerName: `${bill.customer.firstName} ${bill.customer.lastName || ''}`.trim(),
      billAmount: Number(bill.totalAmount),
      billNumber: bill.billNumber,
      pdfUrl: pdfUrl, 
      dueDate: dueDate.toLocaleDateString('en-IN')
    });


      if (result.success) {
        // Optionally, you can log this sending activity in database
        // await this.logWhatsAppActivity(parseInt(billId), result.messageId);
        
        return {
          success: true,
          message: 'Bill sent via WhatsApp successfully',
          data: {
            messageId: result.messageId,
            sentTo: result.to,
            billNumber: bill.billNumber,
            customerName: bill.customer.firstName
          }
        };
      } else {
        return {
          success: false,
          message: 'Failed to send WhatsApp message',
          error: result.error
        };
      }

    } catch (error) {
      return {
        success: false,
        message: error.message || 'Internal server error'
      };
    }
  }

  @Post('send-custom-message')
  @HttpCode(HttpStatus.OK)
  async sendCustomMessage(@Body() body: {
    phoneNumber: string;
    message: string;
  }) {
    try {
      const result = await this.twilioService.sendCustomMessage(
        body.phoneNumber, 
        body.message
      );

      return {
        success: result.success,
        message: result.success ? 'Message sent successfully' : 'Failed to send message',
        data: result.success ? { messageId: result.messageId } : { error: result.error }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Internal server error',
        error: error.message
      };
    }
  }

  @Get('message-status/:messageSid')
  async getMessageStatus(@Param('messageSid') messageSid: string) {
    try {
      const result = await this.twilioService.checkMessageStatus(messageSid);
      
      return {
        success: result.success,
        data: result.success ? {
          status: result.status,
          dateSent: result.dateSent,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        } : { error: result.error }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch message status',
        error: error.message
      };
    }
  }

  // Optional: Webhook endpoint for Twilio status updates
  @Post('webhook/status')
  async handleStatusWebhook(@Body() body: any) {
    try {
      // Log message status updates from Twilio
      console.log('WhatsApp message status update:', body);
      
      // You can update your database with delivery status here
      // await this.updateMessageStatus(body.MessageSid, body.MessageStatus);
      
      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false };
    }
  }
}
