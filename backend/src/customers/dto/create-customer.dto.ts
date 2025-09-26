import { IsString, IsNotEmpty, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { CustomerClassification, UserRole } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  address1: string;

  @IsString()
  @IsOptional()
  address2?: string;

  @IsPhoneNumber('IN') // Assuming Indian phone numbers, adjust as needed
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsEnum(CustomerClassification)
  classification: CustomerClassification;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.CUSTOMER;
}
