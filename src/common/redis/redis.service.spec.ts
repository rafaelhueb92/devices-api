import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

describe('RedisService', () => {
  let service: RedisService;
  let cacheManager: jest.Mocked<Cache>;
  let loggerSpy: jest.SpyInstance;

  const testKey = 'test-key';
  const testValue = { data: 'test-value' };
  const testTtl = 30000;

  beforeEach(async () => {
    const mockCacheManager = {
      set: jest.fn(),
      get: jest.fn(),
    };

    loggerSpy = jest.spyOn(Logger.prototype, 'log');
    jest.spyOn(Logger.prototype, 'error');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should log initialization message', () => {
      expect(loggerSpy).toHaveBeenCalledWith('RedisService initialized');
    });
  });

  describe('setCache', () => {
    it('should successfully set cache with default TTL', async () => {
      await service.setCache(testKey, testValue);

      expect(cacheManager.set).toHaveBeenCalledWith(
        testKey,
        testValue,
        testTtl,
      );
      expect(loggerSpy).toHaveBeenCalledWith(`Set cache: ${testKey}`);
    });

    it('should successfully set cache with custom TTL', async () => {
      const customTtl = 60000;
      await service.setCache(testKey, testValue, customTtl);

      expect(cacheManager.set).toHaveBeenCalledWith(
        testKey,
        testValue,
        customTtl,
      );
    });

    it('should handle errors when setting cache', async () => {
      const error = new Error('Cache set error');
      cacheManager.set.mockRejectedValueOnce(error);

      await service.setCache(testKey, testValue);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to set cache',
        error,
      );
    });
  });

  describe('getCache', () => {
    it('should successfully get cache value', async () => {
      cacheManager.get.mockResolvedValueOnce(testValue);

      const result = await service.getCache(testKey);

      expect(result).toEqual(testValue);
      expect(cacheManager.get).toHaveBeenCalledWith(testKey);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Get cache: ${testKey} ->`,
        testValue,
      );
    });

    it('should return null when cache key not found', async () => {
      cacheManager.get.mockResolvedValueOnce(null);

      const result = await service.getCache(testKey);

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith(testKey);
    });

    it('should handle errors when getting cache', async () => {
      const error = new Error('Cache get error');
      cacheManager.get.mockRejectedValueOnce(error);

      const result = await service.getCache(testKey);

      expect(result).toBeNull();
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to get cache',
        error,
      );
    });
  });
});
