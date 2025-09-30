import { IsOptional, IsString, IsBoolean, IsPhoneNumber, Matches,    MinLength } from 'class-validator';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s\(\)]+$/, { message: 'Phone number must contain only numbers, +, -, spaces, and parentheses' })
  phoneNumber: string;

  @IsOptional()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
