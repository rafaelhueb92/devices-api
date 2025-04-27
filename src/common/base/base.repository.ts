import { Cache } from 'cache-manager';
import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  ProjectionType,
} from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { RetryService } from '../retry/retry.service';
import { QueryOptions } from './interfaces/query-options.interafce';

@Injectable()
export abstract class BaseRepository<T extends Document> {
  protected readonly logger = new Logger(this.constructor.name);
  protected cacheTTL = 300;

  constructor(
    protected readonly model: Model<T>,
    protected readonly cacheManager: Cache,
    protected readonly retryService: RetryService,
  ) {}

  protected getCacheKey(id: string): string {
    return `${this.model.modelName}:${id}`;
  }

  protected getListCacheKey(filter: FilterQuery<T>): string {
    return `${this.model.modelName}:list:${JSON.stringify(filter)}`;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.retryService.execute(async () => {
      const entity = new this.model(data);
      await entity.save();
      await this.cacheManager.set(
        this.getCacheKey(entity.id),
        entity,
        this.cacheTTL,
      );
      return entity;
    }, `${this.model.modelName}.create`);
  }

  async findById(
    id: string,
    projection?: ProjectionType<T>,
  ): Promise<T | null> {
    const cacheKey = this.getCacheKey(id);

    try {
      const cached = await this.cacheManager.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache read failed: ${error.message}`);
    }

    return this.retryService.execute(async () => {
      const entity = await this.model.findById(id, projection).exec();
      if (entity) {
        await this.cacheManager.set(cacheKey, entity, this.cacheTTL);
      }
      return entity;
    }, `${this.model.modelName}.findById`);
  }

  async findAll(options: QueryOptions<T> = {}): Promise<T[]> {
    const {
      filter = {},
      sort,
      limit,
      skip,
      projection,
      populate,
      useCache = false,
    } = options;

    if (useCache) {
      const cacheKey = this.getListCacheKey(filter);
      try {
        const cached = await this.cacheManager.get<T[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache read failed: ${error.message}`);
      }
    }

    return this.retryService.execute(async () => {
      let query = this.model.find(filter, projection);

      if (populate) {
        query = query.populate(populate);
      }

      if (sort) {
        query = query.sort(sort);
      }

      if (skip) {
        query = query.skip(skip);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const results = await query.exec();

      if (useCache) {
        await this.cacheManager.set(
          this.getListCacheKey(filter),
          results,
          this.cacheTTL,
        );
      }

      return results;
    }, `${this.model.modelName}.findAll`);
  }

  async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.retryService.execute(async () => {
      const entity = await this.model
        .findByIdAndUpdate(id, update, { new: true })
        .exec();

      if (entity) {
        await this.cacheManager.set(
          this.getCacheKey(id),
          entity,
          this.cacheTTL,
        );
      } else {
        await this.cacheManager.del(this.getCacheKey(id));
      }

      return entity;
    }, `${this.model.modelName}.update`);
  }

  async delete(id: string): Promise<void> {
    await this.retryService.execute(async () => {
      await this.model.findByIdAndDelete(id).exec();
      await this.cacheManager.del(this.getCacheKey(id));
    }, `${this.model.modelName}.delete`);
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.retryService.execute(
      () => this.model.countDocuments(filter).exec(),
      `${this.model.modelName}.count`,
    );
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    return this.retryService.execute(async () => {
      const count = await this.model.countDocuments(filter).limit(1).exec();
      return count > 0;
    }, `${this.model.modelName}.exists`);
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>,
  ): Promise<T | null> {
    return this.retryService.execute(
      () => this.model.findOne(filter, projection).exec(),
      `${this.model.modelName}.findOne`,
    );
  }
}
