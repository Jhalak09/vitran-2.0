import { IsNumber, IsPositive, IsBoolean, IsOptional } from 'class-validator';

export class ProcessDeliveryDto {
  @IsNumber()
  @IsPositive()
  customerId: number;

  @IsNumber() 
  @IsPositive()
  inventoryId: number;

  @IsNumber()
  @IsPositive()
  deliveredQuantity: number;

  @IsNumber()
  @IsPositive()
  billAmount: number;

  @IsBoolean()
  @IsOptional() // ✅ Optional field with default handling in service
  isPriceCustomized: boolean; // ✅ NEW: Flag to track if price was edited by worker
}
