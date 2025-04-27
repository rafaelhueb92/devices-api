import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
@UseGuards(ThrottlerGuard)
export class HealthController {
  @ApiOperation({ summary: 'Check if api is running' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The api is running.',
  })
  @Get('/')
  check() {}
}
