import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitVerification(@Body() body: {
    deliveries: Array<{
      workerId: number;
      customerId: number;
      inventoryId: number;
      productName: string;
      deliveredQuantity: number;
      bill: number;
      isCollected: boolean;
    }>;
    cashData: Array<{
      workerId: number;
      actualAmount: number;
    }>;
    verifiedBy: string;
  }) {
    try {
      const result = await this.verificationService.submitVerification(body);
      return {
        success: true,
        message: 'Verification submitted successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to submit verification',
        data: null
      };
    }
  }
}
