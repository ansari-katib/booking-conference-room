import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingModule } from './booking/booking.module';
import {ConfigModule} from '@nestjs/config'
import {MongooseModule} from '@nestjs/mongoose'

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    MongooseModule.forRoot(process.env.MONGO_URL as string),
    BookingModule , 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
