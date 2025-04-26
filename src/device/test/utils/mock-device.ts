import { DeviceState } from '../../enums/state.enum';

// test/utils/mock-device.ts
export const createMockDevice = (override = {}) => ({
  id: 'test-id',
  name: 'Test Device',
  brand: 'Test Brand',
  state: DeviceState.AVAILABLE,
  creationTime: new Date(),
  canUpdate: jest.fn(),
  ...override,
});
