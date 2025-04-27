import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DeviceState } from '../enums/state.enum';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  brand: string;
}
