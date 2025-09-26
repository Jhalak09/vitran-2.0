import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    // Check if admin already exists with this email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user (only ADMIN role allowed)
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN', // Always ADMIN for this endpoint
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Admin user created successfully',
      user,
    };
  }

  async getAllUsers() {
    // Get all admin users from User table
    const users = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Admin user not found');
    }

    return user;
  }

  async updateUser(id: number, updateData: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Admin user not found');
    }

    // If password is being updated, hash it
    const updatePayload: any = { ...updateData };
    if (updateData.password) {
      updatePayload.password = await bcrypt.hash(updateData.password, 12);
    }

    // Ensure role stays ADMIN
    updatePayload.role = 'ADMIN';

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Admin user updated successfully',
      user: updatedUser,
    };
  }

  async deleteUser(id: number, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Admin user not found');
    }

    // Don't allow users to delete themselves
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'Admin user deleted successfully',
    };
  }

  async getUserStats() {
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const workerCount = await this.prisma.worker.count();
    const customerCount = await this.prisma.customer.count();

    return {
      admins: adminCount,
      workers: workerCount,
      customers: customerCount,
      total: adminCount + workerCount + customerCount,
    };
  }
}
