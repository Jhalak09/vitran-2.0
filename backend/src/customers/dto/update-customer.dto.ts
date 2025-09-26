import { IsString, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { CustomerClassification, UserRole } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  address1?: string;

  @IsString()
  @IsOptional()
  address2?: string;

  @IsPhoneNumber('IN')
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsEnum(CustomerClassification)
  @IsOptional()
  classification?: CustomerClassification;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
