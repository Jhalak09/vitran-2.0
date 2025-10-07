import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkersModule } from './workers/workers.module';
import { CustomerModule } from './customers/customer.module';
import { ProductModule } from './products/product.module';
import { RelationModule } from './relation/relation.module';
import { InventoryModule } from './inventory/inventory.module';
import { DailyActivityModule } from './dailyactivity/daily-activity.module';
import { BillModule } from './bill/bill.module';
import { TwilioModule } from './twilio/twilio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, 
    UsersModule, 
    PrismaModule,
    WorkersModule,
    CustomerModule,ProductModule, RelationModule, InventoryModule, DailyActivityModule,
    BillModule, TwilioModule
  ],
})
export class AppModule {}
