import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { loginDto, registerDTO } from './dto/registerUser.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { IProfile } from 'passport-azure-ad';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerDto: registerDTO) {
    const saltRound = 10;
    const hash = await bcrypt.hash(registerDto.password, saltRound);

    const user = await this.userService.createUser({
      ...registerDto,
      password: hash,
    });

    return this.generateTokenResponse(user, 'registered successfully');
  }

  async loginUser(loginDto: loginDto) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('user not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokenResponse(user, 'login successfully');
  }

  async getUserById(id: string) {
    const user = await this.userService.getUserById(id);
    return user;
  }

  private buildPayload(user: any) {
    return {
      sub: user?._id,
      role: user?.role ?? 'user',
      email: user?.email,
      fullName: user?.fullName,
    };
  }

  private async generateTokenResponse(user: any, message = 'success') {
    const payload = this.buildPayload(user);
    const access_token = await this.jwtService.signAsync(payload);
    return {
      message,
      access_token,
      user: payload,
    };
  }
}
