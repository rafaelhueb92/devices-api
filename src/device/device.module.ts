import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevicesController } from './device.controller';
import { DevicesService } from './device.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService],
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(ConfigService.get('MONGO_DB_URL')),
    DevicesModule,
  ],
})
export class DevicesModule {}
