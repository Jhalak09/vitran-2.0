import { IsNotEmpty, IsString, IsPhoneNumber, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateWorkerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9+\-\s\(\)]+$/, { message: 'Phone number must contain only numbers, +, -, spaces, and parentheses' })
  phoneNumber: string;

  @IsNotEmpty()
  @MinLength(4)
  password: string;

  @IsOptional()
  isActive?: boolean = true;
}

