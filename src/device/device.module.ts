import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './schemas/device.schema';
import { DeviceController } from './device.controller';
import { RetryModule } from '../common/retry/retry.module';
import { LoggerModule } from '../common/logger/logger.module';
import { RedisModule } from '../common/redis/redis.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { RetryService } from '../common/retry/retry.service';
import { LoggerService } from '../common/logger/logger.service';
import { DeviceRepository } from './repositories/device.repository';
import { ContextModule } from '../common/context-module/context.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    RetryModule,
    CacheModule.register(),
    ConfigModule,
    LoggerModule,
    RedisModule,
    ContextModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceRepository, RetryService, LoggerService],
  exports: [DeviceRepository],
})
export class DevicesModule {}
