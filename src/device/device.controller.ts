// device.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create.dto';
import { UpdateDeviceDto } from './dto/update.dto';
import { Device } from './device.schema';
import { DeviceState } from './enums/state.enum';
import { BasicAuthGuard } from '../common/guards/basic-auth/basic-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBasicAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('devices')
@Controller('devices')
@UseGuards(BasicAuthGuard, ThrottlerGuard)
@ApiBasicAuth()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The device has been successfully created.',
    type: Device,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices with optional filters' })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, enum: DeviceState })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all devices matching the criteria.',
    type: [Device],
  })
  async findAll(
    @Query('brand') brand?: string,
    @Query('state') state?: DeviceState,
  ) {
    return this.deviceService.findAll(brand, state);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the device.',
    type: Device,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Device not found.',
  })
  async findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a device completely' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The device has been successfully updated.',
    type: Device,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or device in use.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device partially' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The device has been successfully updated.',
    type: Device,
  })
  async patch(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a device' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The device has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Device is in use and cannot be deleted.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.deviceService.remove(id);
  }

  @Get('brand/:brand')
  @ApiOperation({ summary: 'Get devices by brand' })
  @ApiParam({ name: 'brand', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all devices of the specified brand.',
    type: [Device],
  })
  async findByBrand(@Param('brand') brand: string): Promise<Device[]> {
    return this.deviceService.findByBrand(brand);
  }

  @Get('state/:state')
  @ApiOperation({ summary: 'Get devices by state' })
  @ApiParam({ name: 'state', enum: DeviceState })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all devices in the specified state.',
    type: [Device],
  })
  async findByState(@Param('state') state: DeviceState): Promise<Device[]> {
    return this.deviceService.findByState(state);
  }
}
