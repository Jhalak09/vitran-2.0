import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('workers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Only admins can manage workers
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorker(@Body() createWorkerDto: CreateWorkerDto) {
    return this.workersService.createWorker(createWorkerDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllWorkers() {
    return this.workersService.getAllWorkers();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getWorkerById(@Param('id', ParseIntPipe) workerId: number) {
    return this.workersService.getWorkerById(workerId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateWorker(
    @Param('id', ParseIntPipe) workerId: number,
    @Body() updateWorkerDto: UpdateWorkerDto
  ) {
    return this.workersService.updateWorker(workerId, updateWorkerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteWorker(@Param('id', ParseIntPipe) workerId: number) {
    return this.workersService.deleteWorker(workerId);
  }

  @Put(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleWorkerStatus(@Param('id', ParseIntPipe) workerId: number) {
    return this.workersService.toggleWorkerStatus(workerId);
  }
}
