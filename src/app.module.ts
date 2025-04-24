import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigurableModuleBuilder.forRoot({
      isGlobal: true,
    }),
    RedisModule,
  ],
})
export class AppModule {}
