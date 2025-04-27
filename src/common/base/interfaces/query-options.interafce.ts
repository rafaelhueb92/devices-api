import { FilterQuery, ProjectionType, SortOrder } from 'mongoose';

export interface QueryOptions<T> {
  filter?: FilterQuery<T>;
  sort?: Record<string, SortOrder>;
  limit?: number;
  skip?: number;
  projection?: ProjectionType<T>;
  populate?: string | string[];
  useCache?: boolean;
}
