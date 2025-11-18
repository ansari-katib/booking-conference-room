import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { registerDTO } from '../auth/dto/registerUser.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(registerDto: registerDTO) {
    try {
      return await this.userModel.create({
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: registerDto.password,
      });
    } catch (error) {
      const DUPLICATE_KEY_CODE = 11000;
      if (error.code === DUPLICATE_KEY_CODE) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} is already registerd`);
      }
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async getUserById(id: string) {
    return this.userModel.findById({ _id: id });
  }
}
