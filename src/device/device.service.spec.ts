import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './device.schema';
import { DeviceState } from './enums/state.enum';
import { CreateDeviceDto } from './dto/create.dto';
import { UpdateDeviceDto } from './dto/update.dto';
import { v4 as uuidv4 } from 'uuid';
import { throwError } from 'rxjs';
import { RetryService } from '../common/retry/retry.service';
import { LoggerService } from '../common/logger/logger.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    private readonly retryService: RetryService,
    private readonly logger: LoggerService,
    private readonly redisCacheService: RedisService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const device = new this.deviceModel({
      id: uuidv4(),
      ...createDeviceDto,
    });

    return this.retryService.execute(async () => {
      try {
        this.redisCacheService.setCache(`${device.id}`, JSON.stringify(device));
        return await device.save();
      } catch (error) {
        if (error.code === 11000) {
          return throwError(
            () => new BadRequestException('Device with this ID already exists'),
          );
        }
        throw error;
      }
    }, `createDevice:${createDeviceDto.name}`);
  }

  async findAll(brand?: string, state?: DeviceState) {
    const query: any = {};
    if (brand) query.brand = brand;
    if (state) query.state = state;

    return this.retryService.execute(async () => {
      try {
        return this.deviceModel.find(query).exec();
      } catch (error) {
        throw error;
      }
    }, `findAllDevices:${brand}/${state}`);
  }

  async findOne(id: string) {
    return this.retryService.execute(async () => {
      try {
        return await this.deviceModel.findOne({ id });
      } catch (error) {
        throw error;
      }
    }, `findOne:${id}`);
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const device = await this.findOne(id);

    if (!device)
      throw new BadRequestException(
        'Cannot update name or brand because Device not exist',
      );

    if (!device.canUpdate(updateDeviceDto)) {
      throw new BadRequestException(
        'Cannot update name or brand while device is in use',
      );
    }

    if (updateDeviceDto['creationTime']) {
      throw new BadRequestException('Creation time cannot be modified');
    }

    return this.retryService.execute(async () => {
      try {
        this.redisCacheService.setCache(
          `${id}`,
          JSON.stringify(updateDeviceDto),
        );
        return this.deviceModel
          .findOneAndUpdate({ id }, updateDeviceDto, { new: true })
          .exec();
      } catch (error) {
        throw error;
      }
    }, `updateDevice:${id}/${updateDeviceDto.brand}`);
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);

    if (!device)
      throw new BadRequestException(
        'Cannot delete name or brand because Device not exist',
      );

    if (device.state === DeviceState.IN_USE) {
      throw new BadRequestException('Cannot delete a device that is in use');
    }

    this.retryService.execute(async () => {
      try {
        const result = await this.deviceModel.deleteOne({ id }).exec();
        if (result.deletedCount === 0) {
          throw new NotFoundException(`Device with ID ${id} not found`);
        }
      } catch (error) {
        throw error;
      }
    }, `deleteDevice:${id}`);
  }

  async findByBrand(brand: string): Promise<Device[]> {
    return this.findAll(brand);
  }

  async findByState(state: DeviceState): Promise<Device[]> {
    return this.findAll(undefined, state);
  }

  async updateState(id: string, state: DeviceState) {
    return this.update(id, { state });
  }
}
