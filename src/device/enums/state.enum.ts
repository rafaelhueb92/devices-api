export enum DeviceState {
  AVAILABLE = 'available',
  IN_USE = 'in-use',
  INACTIVE = 'inactive',
}

export const isValidDeviceState = (state: string): state is DeviceState => {
  return Object.values(DeviceState).includes(state as DeviceState);
};

export const ALLOWED_STATE_TRANSITIONS: Record<DeviceState, DeviceState[]> = {
  [DeviceState.AVAILABLE]: [DeviceState.IN_USE, DeviceState.INACTIVE],
  [DeviceState.IN_USE]: [DeviceState.AVAILABLE, DeviceState.INACTIVE],
  [DeviceState.INACTIVE]: [DeviceState.AVAILABLE],
};
