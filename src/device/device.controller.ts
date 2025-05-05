import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { DeviceRepository } from './repositories/device.repository';
import { CreateDeviceDto } from './dto/create.dto';
import { UpdateDeviceDto } from './dto/update.dto';
import { Device } from './schemas/device.schema';
import { DeviceState } from './enums/state.enum';
import { BasicAuthGuard } from '../common/guards/basic-auth/basic-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBasicAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MongoIdPipe } from '../common/pipes/mongo/mongo-id.pipe';

@ApiTags('devices')
@Controller('devices')
@UseGuards(BasicAuthGuard, ThrottlerGuard)
@ApiBasicAuth()
export class DeviceController {
  constructor(private readonly deviceRepository: DeviceRepository) {}

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
    return this.deviceRepository.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all devices.',
    type: [Device],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.deviceRepository.findAll({
      skip: page * pageSize,
      limit: pageSize,
    });
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
  async findOne(@Param('id', MongoIdPipe) id: string) {
    return this.deviceRepository.findOne({ _id: id });
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
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceRepository.update(id, updateDeviceDto);
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
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceRepository.update(id, updateDeviceDto);
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
  async delete(@Param('id', MongoIdPipe) id: string): Promise<void> {
    return await this.deviceRepository.delete(id);
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
    return await this.deviceRepository.findAll({ filter: { brand } });
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
    return await this.deviceRepository.findAll({ filter: { state } });
  }
}
