import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { DeviceRepository } from './device.repository';
import { Device, DeviceDocument } from '../schemas/device.schema';
import { RetryService } from '../../common/retry/retry.service';
import { DeviceState } from '../enums/state.enum';

describe('DeviceRepository', () => {
  let repository: DeviceRepository;
  let model: Model<DeviceDocument>;
  let cacheManager: jest.Mocked<Cache>;
  let retryService: jest.Mocked<RetryService>;

  const mockDevice = {
    id: 'deviceId',
    name: 'Test Device',
    brand: 'Test Brand',
    state: DeviceState.AVAILABLE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceRepository,
        {
          provide: getModelToken(Device.name),
          useValue: {
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {
            execute: jest.fn((fn) => fn()),
          },
        },
      ],
    }).compile();

    repository = module.get<DeviceRepository>(DeviceRepository);
    model = module.get<Model<DeviceDocument>>(getModelToken(Device.name));
    cacheManager = module.get(CACHE_MANAGER);
    retryService = module.get(RetryService);
  });

  describe('update', () => {
    it('should update device when it is not in use', async () => {
      const updateDTO = { name: 'New Name' };
      const updatedDevice = { ...mockDevice, ...updateDTO };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockDevice as DeviceDocument);
      jest.spyOn(repository as any, 'update').mockResolvedValue(updatedDevice);

      const result = await repository.update('deviceId', updateDTO);

      expect(result).toEqual(updatedDevice);
    });

    it('should throw BadRequestException when device is not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(
        repository.update('deviceId', { name: 'New Name' }),
      ).rejects.toThrow(
        new BadRequestException('Device with id deviceId not found'),
      );
    });

    it('should throw BadRequestException when trying to update name of in-use device', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(inUseDevice as DeviceDocument);

      await expect(
        repository.update('deviceId', { name: 'New Name' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Cannot modify name or brand of device deviceId while it is in use',
        ),
      );
    });

    it('should throw BadRequestException when trying to update brand of in-use device', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(inUseDevice as DeviceDocument);

      await expect(
        repository.update('deviceId', { brand: 'New Brand' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Cannot modify name or brand of device deviceId while it is in use',
        ),
      );
    });

    it('should allow updating other properties when device is in use', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      const updateDTO = { description: 'New Description' };
      const updatedDevice = { ...inUseDevice, ...updateDTO };

      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(inUseDevice as DeviceDocument);
      jest.spyOn(repository as any, 'update').mockResolvedValue(updatedDevice);

      const result = await repository.update('deviceId', updateDTO);

      expect(result).toEqual(updatedDevice);
    });
  });

  describe('delete', () => {
    it('should delete device when it is not in use', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockDevice as DeviceDocument);
      jest.spyOn(repository as any, 'delete').mockResolvedValue(undefined);

      await expect(repository.delete('deviceId')).resolves.not.toThrow();
    });

    it('should throw BadRequestException when device is not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(repository.delete('deviceId')).rejects.toThrow(
        new BadRequestException('Device with id deviceId not found'),
      );
    });

    it('should throw BadRequestException when trying to delete in-use device', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(inUseDevice as DeviceDocument);

      await expect(repository.delete('deviceId')).rejects.toThrow(
        new BadRequestException(
          'Cannot modify name or brand of device deviceId while it is in use',
        ),
      );
    });
  });

  describe('isNameOrBrandChanged', () => {
    it('should return true when name is changed', () => {
      const device = { name: 'Old Name', brand: 'Brand' } as DeviceDocument;
      const updateDTO = { name: 'New Name' };

      const result = repository['isNameOrBrandChanged'](device, updateDTO);

      expect(result).toBe(true);
    });

    it('should return true when brand is changed', () => {
      const device = { name: 'Name', brand: 'Old Brand' } as DeviceDocument;
      const updateDTO = { brand: 'New Brand' };

      const result = repository['isNameOrBrandChanged'](device, updateDTO);

      expect(result).toBe(true);
    });

    it('should return false when neither name nor brand is changed', () => {
      const device = { name: 'Name', brand: 'Brand' } as DeviceDocument;
      const updateDTO = {};

      const result = repository['isNameOrBrandChanged'](device, updateDTO);

      expect(result).toBe(false);
    });

    it('should return false when name and brand are same as current values', () => {
      const device = { name: 'Name', brand: 'Brand' } as DeviceDocument;
      const updateDTO = { name: 'Name', brand: 'Brand' };

      const result = repository['isNameOrBrandChanged'](device, updateDTO);

      expect(result).toBe(false);
    });
  });

  describe('checkDeviceStatus', () => {
    it('should return device when it exists and is not in use', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockDevice as DeviceDocument);

      const result = await repository['checkDeviceStatus']('deviceId');

      expect(result).toEqual(mockDevice);
    });

    it('should throw BadRequestException when device is not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(repository['checkDeviceStatus']('deviceId')).rejects.toThrow(
        new BadRequestException('Device with id deviceId not found'),
      );
    });

    it('should allow checking in-use device without updates', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(inUseDevice as DeviceDocument);

      const result = await repository['checkDeviceStatus']('deviceId', {
        state: DeviceState.IN_USE,
      });

      expect(result).toEqual(inUseDevice);
    });
  });
});
