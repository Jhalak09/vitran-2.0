import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioController } from './twilio.controller';
import { BillModule } from '../bill/bill.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, BillModule],
  controllers: [TwilioController],
  providers: [TwilioService],
  exports: [TwilioService] // Export for use in other modules
})
export class TwilioModule {}
