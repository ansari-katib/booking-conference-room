import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { loginDto, registerDTO } from './dto/registerUser.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerDto: registerDTO) {
    const saltRound = 10;
    const hash = await bcrypt.hash(registerDto.password, saltRound);

    // logic for user register.
    /**
     * 1. check if email already exists
     * 2. hash the password
     * 3. store the user into db
     * 4. generate jwt token
     * 5. send token in response
     */

    const user = await this.userService.createUser({
      ...registerDto,
      password: hash,
    });

    const payload = { sub: user?._id };
    const token = await this.jwtService.signAsync(payload);
    return { access_token: token };
  }

  async loginUser(loginDto: loginDto) {
    /**
     * 1. receive email and password
     * 2. match email and password
     * 3. generate jwt token
     */
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('user not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user?._id };
    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'login successfully',
      access_token: token,
    };
  }
}
