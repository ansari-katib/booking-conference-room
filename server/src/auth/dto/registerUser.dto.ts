import { IsString, IsEmail, IsOptional } from 'class-validator';

export class registerDTO {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  role?: string;
}

export class loginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
