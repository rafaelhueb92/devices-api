import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name); // Using global logger

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.logger.log('RedisService initialized');
  }

  async setCache(key: string, value: any, ttl = 30000): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.log(`Set cache: ${key}`);
    } catch (error) {
      this.logger.error('Failed to set cache', error);
    }
  }

  async getCache(key: string): Promise<any> {
    try {
      const value = await this.cacheManager.get(key);
      this.logger.log(`Get cache: ${key} ->`, value);
      return value;
    } catch (error) {
      this.logger.error('Failed to get cache', error);
      return null;
    }
  }
}
