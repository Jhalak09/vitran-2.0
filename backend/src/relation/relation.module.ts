import { Module } from '@nestjs/common';
import { RelationService } from './relation.service';
import { RelationController } from './relation.controller';
import { PrismaService } from '../prisma/prisma.service';       
import { InventoryModule } from 'src/inventory/inventory.module';


@Module({
  imports: [InventoryModule],
  controllers: [RelationController],    
    providers: [RelationService, PrismaService],
    exports: [RelationService],
})
export class RelationModule {}