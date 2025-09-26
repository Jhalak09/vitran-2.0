import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

async createWorker(createWorkerDto: CreateWorkerDto) {
  const { firstName, lastName, phoneNumber, password, isActive = true } = createWorkerDto;

  // Check if worker already exists with this phone number
  const existingWorker = await this.prisma.worker.findUnique({
    where: { phoneNumber },
  });

  if (existingWorker) {
    throw new ConflictException('Worker with this phone number already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // ✅ USE TRANSACTION to ensure both worker and tracking entry are created
  const result = await this.prisma.$transaction(async (prisma) => {
    // Create the worker
    const worker = await prisma.worker.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        password: hashedPassword,
        role: 'WORKER',
        isActive,
      },
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });

    return worker;
  });

  return {
    message: 'Worker created successfully',
    worker: result,
  };
}

  async getAllWorkers() {
    return this.prisma.worker.findMany({
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkerById(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { workerId },
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  async updateWorker(workerId: number, updateData: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({
      where: { workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Check if phone number is being changed and if it already exists
    if (updateData.phoneNumber && updateData.phoneNumber !== worker.phoneNumber) {
      const existingWorker = await this.prisma.worker.findUnique({
        where: { phoneNumber: updateData.phoneNumber },
      });

      if (existingWorker) {
        throw new ConflictException('Worker with this phone number already exists');
      }
    }

    // Prepare update payload
    const updatePayload: any = { ...updateData };
    
    // If password is being updated, hash it
    if (updateData.password) {
      updatePayload.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedWorker = await this.prisma.worker.update({
      where: { workerId },
      data: updatePayload,
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });

    return {
      message: 'Worker updated successfully',
      worker: updatedWorker,
    };
  }

  async deleteWorker(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    await this.prisma.worker.delete({
      where: { workerId },
    });

    return {
      message: 'Worker deleted successfully',
    };
  }

  async toggleWorkerStatus(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const updatedWorker = await this.prisma.worker.update({
      where: { workerId },
      data: { isActive: !worker.isActive },
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });

    return {
      message: `Worker ${updatedWorker.isActive ? 'activated' : 'deactivated'} successfully`,
      worker: updatedWorker,
    };
  }

  async getWorkerStats() {
    const total = await this.prisma.worker.count();
    const active = await this.prisma.worker.count({
      where: { isActive: true },
    });
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }
}
