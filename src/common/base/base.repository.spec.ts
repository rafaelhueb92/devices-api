import { Cache } from 'cache-manager';
import { Model, Document, Query } from 'mongoose';
import { RetryService } from '../retry/retry.service';
import { BaseRepository } from './base.repository';

interface TestDocument extends Document {
  name: string;
  value: number;
}

class TestRepository extends BaseRepository<TestDocument> {
  constructor(
    model: Model<TestDocument>,
    cacheManager: Cache,
    retryService: RetryService,
  ) {
    super(model, cacheManager, retryService);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let model: Model<TestDocument>;
  let cacheManager: jest.Mocked<Cache>;
  let retryService: jest.Mocked<RetryService>;

  beforeEach(async () => {
    function MockModel(this: any, data: any) {
      Object.assign(this, data);
      this.id = 'testId';
      this.save = jest.fn().mockResolvedValue(this);
    }

    MockModel.modelName = 'Test';
    MockModel.find = jest.fn();
    MockModel.findById = jest.fn();
    MockModel.findOne = jest.fn();
    MockModel.findByIdAndUpdate = jest.fn();
    MockModel.findByIdAndDelete = jest.fn();
    MockModel.countDocuments = jest.fn();
    MockModel.prototype.save = jest.fn().mockResolvedValue({});

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Cache>;

    const mockRetryService = {
      execute: jest.fn((fn) => fn()),
    } as unknown as jest.Mocked<RetryService>;

    model = MockModel as unknown as Model<TestDocument>;
    cacheManager = mockCacheManager;
    retryService = mockRetryService;
    repository = new TestRepository(model, cacheManager, retryService);
  });

  describe('create', () => {
    it('should create and cache a new entity', async () => {
      const mockData = { name: 'test', value: 1 };
      const mockEntity = { id: 'testId', ...mockData };

      const result = await repository.create(mockData);

      expect(result).toMatchObject(mockEntity);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'Test:testId',
        expect.objectContaining(mockEntity),
        300,
      );
    });
  });

  describe('findById', () => {
    it('should return cached entity if available', async () => {
      const mockEntity = { id: 'testId', name: 'test' };
      cacheManager.get.mockResolvedValue(mockEntity);

      const result = await repository.findById('testId');

      expect(result).toEqual(mockEntity);
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      const mockEntity = { id: 'testId', name: 'test' };
      cacheManager.get.mockResolvedValue(null);
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEntity),
      });

      const result = await repository.findById('testId');

      expect(result).toEqual(mockEntity);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'Test:testId',
        mockEntity,
        300,
      );
    });
  });

  describe('findAll', () => {
    it('should return all entities with filters', async () => {
      const mockEntities = [
        { id: '1', name: 'test1' },
        { id: '2', name: 'test2' },
      ];

      const mockQueryBuilder = {
        exec: jest.fn().mockResolvedValue(mockEntities),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      (model.find as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await repository.findAll({
        filter: { name: 'test' },
        sort: { name: 1 },
        limit: 10,
        skip: 0,
        populate: 'relation',
        useCache: true,
      });

      expect(result).toEqual(mockEntities);
      expect(model.find).toHaveBeenCalledWith({ name: 'test' }, undefined);
    });
  });

  describe('update', () => {
    it('should update and cache entity', async () => {
      const mockEntity = { id: 'testId', name: 'updated' };
      (model.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEntity),
      });

      const result = await repository.update('testId', { name: 'updated' });

      expect(result).toEqual(mockEntity);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'Test:testId',
        mockEntity,
        300,
      );
    });
  });

  describe('delete', () => {
    it('should delete entity and remove from cache', async () => {
      (model.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      await repository.delete('testId');

      expect(model.findByIdAndDelete).toHaveBeenCalledWith('testId');
      expect(cacheManager.del).toHaveBeenCalledWith('Test:testId');
    });
  });

  describe('count', () => {
    it('should return count of entities', async () => {
      (model.countDocuments as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await repository.count({ name: 'test' });

      expect(result).toBe(5);
    });
  });

  describe('exists', () => {
    it('should return true if entity exists', async () => {
      (model.countDocuments as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await repository.exists({ name: 'test' });

      expect(result).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should find single entity', async () => {
      const mockEntity = { id: 'testId', name: 'test' };
      (model.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEntity),
      });

      const result = await repository.findOne({ name: 'test' });

      expect(result).toEqual(mockEntity);
    });
  });

  describe('error handling', () => {
    it('should handle cache errors gracefully', async () => {
      const mockEntity = { id: 'testId', name: 'test' };
      cacheManager.get.mockRejectedValue(new Error('Cache error'));
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEntity),
      });

      const result = await repository.findById('testId');

      expect(result).toEqual(mockEntity);
    });

    it('should handle database errors through retry service', async () => {
      const error = new Error('Database error');
      (model.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      });

      retryService.execute.mockRejectedValue(error);

      await expect(repository.findById('testId')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
