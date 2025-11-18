import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingModule } from './booking/booking.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL as string),
    BookingModule,
    // ...(process.env.NODE_ENV === 'production'
    //   ? [
    //       ServeStaticModule.forRoot({
    //         rootPath: join(__dirname, '..', 'client', 'dist'), // path to your frontend build
    //         exclude: ['/booking*'], // exclude API routes
    //       }),
    //     ]
    //   : []),
    AuthModule,
    UserModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
