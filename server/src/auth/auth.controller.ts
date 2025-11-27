import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, registerDTO } from './dto/registerUser.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: registerDTO) {
    const createdUser = await this.authService.registerUser(registerDto);
    return createdUser;
  }

  @Post('login')
  async login(@Body() loginDto: loginDto) {
    const login = await this.authService.loginUser(loginDto);
    return login;
  }

  @Get('me/:id')
  async currentUser(@Param('id') id: string) {
    const user = await this.authService.getUserById(id);
    return user;
  }
}
