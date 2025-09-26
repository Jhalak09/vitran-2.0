import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from '@prisma/client';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      const customer = await this.customerService.create(createCustomerDto);
      return {
        success: true,
        message: 'Customer created successfully',
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  async findAll() {
    try {
      const customers = await this.customerService.findAll();
      return {
        success: true,
        message: 'Customers retrieved successfully',
        data: customers,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('search')
  async findByPhone(@Query('phone') phoneNumber: string) {
    try {
      const customer = await this.customerService.findByPhoneNumber(phoneNumber);
      return {
        success: true,
        message: customer ? 'Customer found' : 'No customer found',
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const customer = await this.customerService.findOne(id);
      return {
        success: true,
        message: 'Customer retrieved successfully',
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: Partial<CreateCustomerDto>,
  ) {
    try {
      const customer = await this.customerService.update(id, updateCustomerDto);
      return {
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }
}
