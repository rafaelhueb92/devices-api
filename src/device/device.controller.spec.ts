jest.mock('../common/guards/basic-auth/basic-auth.guard', () => ({
  BasicAuthGuard: class {},
}));
jest.mock('@nestjs/throttler', () => ({
  ThrottlerGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceRepository } from './repositories/device.repository';
import { Device } from './schemas/device.schema';
import { DeviceState } from './enums/state.enum';

describe('DeviceController', () => {
  let controller: DeviceController;
  let repository: jest.Mocked<DeviceRepository>;

  const mockDevice: Device = {
    name: 'Test Device',
    brand: 'Test Brand',
    state: DeviceState.AVAILABLE,
  };

  const mockDevices = [
    mockDevice,
    { ...mockDevice, id: 'deviceId2', name: 'Test Device 2' },
  ];

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [{ provide: DeviceRepository, useValue: mockRepository }],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
    repository = module.get(DeviceRepository);
  });

  it('should create a device', async () => {
    repository.create.mockResolvedValue(mockDevice as any);
    const result = await controller.create({
      name: 'Test Device',
      brand: 'Test Brand',
    });
    expect(result).toEqual(mockDevice);
    expect(repository.create).toHaveBeenCalled();
  });

  it('should return all devices', async () => {
    repository.findAll.mockResolvedValue(mockDevices as any);
    const result = await controller.findAll();
    expect(result).toEqual(mockDevices);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('should return a device by id', async () => {
    repository.findOne.mockResolvedValue(mockDevice as any);
    const result = await controller.findOne('deviceId');
    expect(result).toEqual(mockDevice);
    expect(repository.findOne).toHaveBeenCalledWith({ _id: 'deviceId' });
  });

  it('should update a device', async () => {
    repository.update.mockResolvedValue({
      ...mockDevice,
      name: 'Updated',
    } as any);
    const result = await controller.update('deviceId', { name: 'Updated' });
    expect(result).toEqual({ ...mockDevice, name: 'Updated' });
    expect(repository.update).toHaveBeenCalledWith('deviceId', {
      name: 'Updated',
    });
  });

  it('should patch a device', async () => {
    repository.update.mockResolvedValue({
      ...mockDevice,
      name: 'Patched',
    } as any);
    const result = await controller.patch('deviceId', { name: 'Patched' });
    expect(result).toEqual({ ...mockDevice, name: 'Patched' });
    expect(repository.update).toHaveBeenCalledWith('deviceId', {
      name: 'Patched',
    });
  });

  it('should delete a device', async () => {
    repository.delete.mockResolvedValue(undefined);
    await controller.delete('deviceId');
    expect(repository.delete).toHaveBeenCalledWith('deviceId');
  });

  it('should return devices by brand', async () => {
    repository.findAll.mockResolvedValue([mockDevice as any]);
    const result = await controller.findByBrand('Test Brand');
    expect(result).toEqual([mockDevice]);
    expect(repository.findAll).toHaveBeenCalledWith({
      filter: { brand: 'Test Brand' },
    });
  });

  it('should return devices by state', async () => {
    repository.findAll.mockResolvedValue([mockDevice as any]);
    const result = await controller.findByState(DeviceState.AVAILABLE);
    expect(result).toEqual([mockDevice]);
    expect(repository.findAll).toHaveBeenCalledWith({
      filter: { state: DeviceState.AVAILABLE },
    });
  });
});
