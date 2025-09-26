// dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { store } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Current price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Current price must be greater than or equal to 0' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : parseFloat(num.toFixed(2));
    }
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(2));
    }
    return value;
  })
  currentProductPrice: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Last price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Last price must be greater than or equal to 0' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : parseFloat(num.toFixed(2));
    }
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(2));
    }
    return value;
  })
  lastProductPrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(store, { message: 'Store must be either SANCHI or SABORO' })
  storeId: store;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Current price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Current price must be greater than or equal to 0' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : parseFloat(num.toFixed(2));
    }
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(2));
    }
    return value;
  })
  currentProductPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Last price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Last price must be greater than or equal to 0' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : parseFloat(num.toFixed(2));
    }
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(2));
    }
    return value;
  })
  lastProductPrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(store, { message: 'Store must be either SANCHI or SABORO' })
  storeId?: store;
}
