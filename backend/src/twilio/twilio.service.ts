import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

interface WhatsAppMessageData {
  phoneNumber: string;
  customerName: string;
  billAmount: number;
  billNumber: string;
  pdfUrl: string;
  dueDate?: string;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not found in environment variables');
    }

    this.client = Twilio(accountSid, authToken);
    this.logger.log('Twilio service initialized successfully');
  }

  async sendBillViaWhatsApp(data: WhatsAppMessageData) {
    try {
      const { phoneNumber, customerName, billAmount, billNumber, pdfUrl, dueDate } = data;
      
      // Format phone number (ensure it starts with country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Create message body
      const messageBody = this.createBillMessage(customerName, billAmount, billNumber, dueDate);
      
      // Send message with PDF attachment
      const message = await this.client.messages.create({
        from: this.configService.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886', // Sandbox number
        to: `whatsapp:${formattedPhone}`,
        body: messageBody,
        mediaUrl: [pdfUrl] 
      });
      console.log('Message SID:', message.sid);

      this.logger.log(`WhatsApp message sent successfully to ${formattedPhone}, MessageSID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        to: formattedPhone,
        sentAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
  }

  async sendCustomMessage(phoneNumber: string, message: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await this.client.messages.create({
        from: this.configService.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };

    } catch (error) {
      this.logger.error(`Failed to send custom WhatsApp message: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkMessageStatus(messageSid: string) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateSent: message.dateSent
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces, dashes, and other non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  private createBillMessage(customerName: string, billAmount: number, billNumber: string, dueDate?: string): string {
    const dueDateText = dueDate ? `\nDue Date: ${dueDate}` : '';
    
    return `🧾 *Vidhan Sanchi Milk Depot*
    
Hi ${customerName}! 👋

Your milk delivery bill is ready:
📄 Bill Number: ${billNumber}
💰 Total Amount: ₹${billAmount.toFixed(2)}${dueDateText}

📎 Please find your detailed bill attached as PDF.

Thank you for choosing us for fresh milk delivery! 🥛

For any queries, contact us:
📞9826987703

*This is an automated message from Vidhan Sanchi Milk Depot*`;
  }
}
