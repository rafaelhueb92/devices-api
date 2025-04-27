import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Device, DeviceDocument } from '../schemas/device.schema';
import { BaseRepository } from '../../common/base/base.repository';
import { RetryService } from '../../common/retry/retry.service';
import { DeviceState } from '../enums/state.enum';

@Injectable()
export class DeviceRepository extends BaseRepository<DeviceDocument> {
  constructor(
    @InjectModel(Device.name) deviceModel: Model<DeviceDocument>,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    retryService: RetryService,
  ) {
    super(deviceModel, cacheManager, retryService);
    this.cacheTTL = 600;
  }

  private isNameOrBrandChanged(
    device: DeviceDocument,
    updateDTO: Partial<Device>,
  ): boolean {
    const isNameChanged =
      updateDTO.name !== undefined && updateDTO.name !== device.name;
    const isBrandChanged =
      updateDTO.brand !== undefined && updateDTO.brand !== device.brand;
    return isNameChanged || isBrandChanged;
  }

  private async checkDeviceStatus(
    id: string,
    updateDTO?: Partial<Device>,
  ): Promise<DeviceDocument> {
    const device = await this.findById(id);
    console.log('checkDeviceStatus', updateDTO, device);
    if (!device) {
      throw new BadRequestException(`Device with id ${id} not found`);
    }

    if (device.state === DeviceState.IN_USE) {
      if (
        !updateDTO ||
        (updateDTO && this.isNameOrBrandChanged(device, updateDTO))
      ) {
        throw new BadRequestException(
          `Cannot modify name or brand of device ${id} while it is in use`,
        );
      }
    }
    return device;
  }

  async update(
    id: string,
    updateDTO: UpdateQuery<DeviceDocument>,
  ): Promise<DeviceDocument | null> {
    await this.checkDeviceStatus(id, updateDTO as Partial<Device>);
    return super.update(id, updateDTO);
  }

  async delete(id: string): Promise<void> {
    await this.checkDeviceStatus(id);
    return super.delete(id);
  }
}
