import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create.dto';
import { UpdateDeviceDto } from './dto/update.dto';
import { Device } from './device.schema';
import { DeviceState } from './enums/state.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DeviceController', () => {
  let controller: DeviceController;
  let service: DeviceService;

  const mockDevice: Device = {
    id: 'test-id',
    name: 'Test Device',
    brand: 'Test Brand',
    state: DeviceState.AVAILABLE,
    creationTime: new Date(),
    canUpdate: jest.fn(),
  };

  const mockDeviceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByBrand: jest.fn(),
    findByState: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        {
          provide: DeviceService,
          useValue: mockDeviceService,
        },
      ],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
    service = module.get<DeviceService>(DeviceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateDeviceDto = {
      name: 'New Device',
      brand: 'New Brand',
      state: DeviceState.AVAILABLE,
    };

    it('should create a device successfully', async () => {
      mockDeviceService.create.mockResolvedValueOnce(mockDevice);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when creation fails', async () => {
      mockDeviceService.create.mockRejectedValueOnce(
        new BadRequestException('Creation failed'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all devices when no filters provided', async () => {
      mockDeviceService.findAll.mockResolvedValueOnce([mockDevice]);

      const result = await controller.findAll();

      expect(result).toEqual([mockDevice]);
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter by brand when provided', async () => {
      mockDeviceService.findAll.mockResolvedValueOnce([mockDevice]);

      await controller.findAll('Test Brand');

      expect(service.findAll).toHaveBeenCalledWith('Test Brand', undefined);
    });

    it('should filter by state when provided', async () => {
      mockDeviceService.findAll.mockResolvedValueOnce([mockDevice]);

      await controller.findAll(undefined, DeviceState.AVAILABLE);

      expect(service.findAll).toHaveBeenCalledWith(
        undefined,
        DeviceState.AVAILABLE,
      );
    });
  });

  describe('findOne', () => {
    it('should return a device by id', async () => {
      mockDeviceService.findOne.mockResolvedValueOnce(mockDevice);

      const result = await controller.findOne('test-id');

      expect(result).toEqual(mockDevice);
      expect(service.findOne).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when device not found', async () => {
      mockDeviceService.findOne.mockResolvedValueOnce(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDeviceDto = {
      name: 'Updated Device',
      state: DeviceState.IN_USE,
    };

    it('should update a device successfully', async () => {
      mockDeviceService.update.mockResolvedValueOnce({
        ...mockDevice,
        ...updateDto,
      });

      const result = await controller.update('test-id', updateDto);

      expect(result).toEqual({ ...mockDevice, ...updateDto });
      expect(service.update).toHaveBeenCalledWith('test-id', updateDto);
    });

    it('should throw BadRequestException when update fails', async () => {
      mockDeviceService.update.mockRejectedValueOnce(
        new BadRequestException('Update failed'),
      );

      await expect(controller.update('test-id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('patch', () => {
    const patchDto: UpdateDeviceDto = {
      state: DeviceState.IN_USE,
    };

    it('should patch a device successfully', async () => {
      mockDeviceService.update.mockResolvedValueOnce({
        ...mockDevice,
        ...patchDto,
      });

      const result = await controller.patch('test-id', patchDto);

      expect(result).toEqual({ ...mockDevice, ...patchDto });
      expect(service.update).toHaveBeenCalledWith('test-id', patchDto);
    });
  });

  describe('remove', () => {
    it('should remove a device successfully', async () => {
      mockDeviceService.remove.mockResolvedValueOnce(undefined);

      await controller.remove('test-id');

      expect(service.remove).toHaveBeenCalledWith('test-id');
    });

    it('should throw BadRequestException when device is in use', async () => {
      mockDeviceService.remove.mockRejectedValueOnce(
        new BadRequestException('Device is in use'),
      );

      await expect(controller.remove('test-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByBrand', () => {
    it('should return devices by brand', async () => {
      mockDeviceService.findByBrand.mockResolvedValueOnce([mockDevice]);

      const result = await controller.findByBrand('Test Brand');

      expect(result).toEqual([mockDevice]);
      expect(service.findByBrand).toHaveBeenCalledWith('Test Brand');
    });
  });

  describe('findByState', () => {
    it('should return devices by state', async () => {
      mockDeviceService.findByState.mockResolvedValueOnce([mockDevice]);

      const result = await controller.findByState(DeviceState.AVAILABLE);

      expect(result).toEqual([mockDevice]);
      expect(service.findByState).toHaveBeenCalledWith(DeviceState.AVAILABLE);
    });
  });
});
