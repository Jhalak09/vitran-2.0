import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { WorkerLoginDto } from './dto/worker-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  // Find user by email
  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }


  // Generate hash for comparison (debugging purpose)
  const testHash = await bcrypt.hash(password, 12);

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }


    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }


  async workerLogin(workerLoginDto: WorkerLoginDto) {
    const { phoneNumber, password } = workerLoginDto;

    // Find worker by phone number
    const worker = await this.prisma.worker.findUnique({
      where: { phoneNumber },
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!worker) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Check if worker is active
    if (!worker.isActive) {
      throw new UnauthorizedException('Worker account is inactive. Please contact admin.');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, worker.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Generate JWT token for worker
    const payload = {
      sub: worker.workerId,
      phoneNumber: worker.phoneNumber,
      role: worker.role,
      userType: 'WORKER' // ✅ Add userType to distinguish from admin users
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Worker login successful',
      token,
      userType: 'WORKER',
      worker: {
        workerId: worker.workerId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        phoneNumber: worker.phoneNumber,
        role: worker.role,
        isActive: worker.isActive,
      },
    };
  }

  // ✅ Updated validateToken to handle both users and workers
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Check if it's a worker or user based on userType
      if (payload.userType === 'WORKER') {
        const worker = await this.prisma.worker.findUnique({
          where: { workerId: payload.sub },
          select: {
            workerId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
            isActive: true,
          },
        });

        if (!worker || !worker.isActive) {
          throw new UnauthorizedException('Invalid token or inactive worker');
        }

        return {
          ...worker,
          userType: 'WORKER',
          id: worker.workerId, // For compatibility
        };
      } else {
        // Handle regular user
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        if (!user) {
          throw new UnauthorizedException('Invalid token');
        }

        return {
          ...user,
          userType: 'USER',
        };
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ✅ Helper method to validate worker specifically
  async validateWorker(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { workerId },
      select: {
        workerId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
      },
    });

    if (!worker || !worker.isActive) {
      throw new UnauthorizedException('Worker not found or inactive');
    }

    return worker;
  }
}

