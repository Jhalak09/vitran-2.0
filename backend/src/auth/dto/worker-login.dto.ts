import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class WorkerLoginDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
