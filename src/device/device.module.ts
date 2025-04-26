import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device.schema';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { RetryModule } from '../common/retry/retry.module';
import { LoggerModule } from '../common/logger/logger.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    RetryModule,
    LoggerModule,
    RedisModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DevicesModule {}
