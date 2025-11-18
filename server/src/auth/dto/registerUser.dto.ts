import { IsString, IsEmail } from 'class-validator';

export class registerDTO {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class loginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
