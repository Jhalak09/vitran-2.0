import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
  try {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phoneNumber: createCustomerDto.phoneNumber }
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this phone number already exists');
    }

    // Use transaction to ensure both customer and tracking entry are created
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the customer
      const customer = await prisma.customer.create({
        data: {
          firstName: createCustomerDto.firstName,
          lastName: createCustomerDto.lastName,
          address1: createCustomerDto.address1,
          address2: createCustomerDto.address2,
          phoneNumber: createCustomerDto.phoneNumber,
          city: createCustomerDto.city,
          pincode: createCustomerDto.pincode,
          classification: createCustomerDto.classification,
          role: 'CUSTOMER',
        },
      });

      return customer;
    });

    return result;
  } catch (error) {
    throw error;
  }
}

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(customerId: number): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { phoneNumber },
    });
  }

  async update(customerId: number, updateData: Partial<CreateCustomerDto>): Promise<Customer> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { customerId }
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    if (updateData.phoneNumber && updateData.phoneNumber !== existingCustomer.phoneNumber) {
      const phoneExists = await this.findByPhoneNumber(updateData.phoneNumber);
      if (phoneExists) {
        throw new ConflictException('Phone number already exists');
      }
    }

    return this.prisma.customer.update({
      where: { customerId },
      data: updateData,
    });
  }
}
