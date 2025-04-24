import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DeviceState } from '../enums/state.enum';

export class UpdateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsNotEmpty()
  brand?: string;

  @IsEnum(DeviceState)
  state?: DeviceState;
}
