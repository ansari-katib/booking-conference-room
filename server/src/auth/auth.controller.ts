import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, registerDTO } from './dto/registerUser.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

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

  @Get('azure/login')
  @UseGuards(AuthGuard('azure'))
  async azureLogin() {
    return;
  }

  @Post('azure/callback')
  @UseGuards(AuthGuard('azure'))
  async azureCallbackPost(@Req() req: any, @Res() res: Response) {
    return this.handleAzureCallback(req, res);
  }

  @Get('azure/callback')
  @UseGuards(AuthGuard('azure'))
  async azureCallbackGet(@Req() req: any, @Res() res: Response) {
    return this.handleAzureCallback(req, res);
  }

  private async handleAzureCallback(req: any, res: Response) {
    const { token, user } = await this.authService.generateAzureLoginResponse(
      req.user,
    );
    const redirectUrl = new URL(
      `${process.env.FRONTEND_BASE_URL}/auth/azure-response`,
      // `http://localhost:5000/auth/azure-response`,
    );
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('role', user.role ?? 'user');
    redirectUrl.searchParams.set('fullName', user.fullName ?? '');
    redirectUrl.searchParams.set('email', user.email ?? '');
    return res.redirect(redirectUrl.toString());
  }
}
