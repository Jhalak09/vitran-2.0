// customer-delivery.controller.ts
import { 
  Controller, 
  Post, 
  Get,
  Body, 
  UseGuards, 
  Request 
} from '@nestjs/common'
import { CustomerDeliveryService } from './customer-delivery.service'
import { ProcessDeliveryDto } from './dto/process-delivery.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PrismaService } from '../prisma/prisma.service' // assuming you have this

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerDeliveryController {
  constructor(
    private deliveryService: CustomerDeliveryService,
    private prisma: PrismaService, // inject Prisma
  ) {}

  @Post('process')
  @Roles('WORKER')
  async processDelivery(@Body() dto: ProcessDeliveryDto, @Request() req) {
    try {
      const userLogin = req.user.sub
      console.log('Processing delivery for user:', userLogin)
      return await this.deliveryService.processDelivery(dto, userLogin, req.user.role)
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  @Post('total-amount')
@Roles('WORKER')
async addCashInHand(@Body('amount') amount: number, @Request() req) {
  try {
    if (!amount || isNaN(amount)) {
      return {
        success: false,
        message: 'Valid amount is required',
      }
    }

    const workerId = req.user.workerId
    console.log('Worker ID:', workerId)

    // Define today's start and end time
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    // Check if record already exists for today
    const existingRecord = await this.prisma.cashInHand.findFirst({
      where: {
        workerId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { date: 'desc' },
    })

    if (existingRecord) {
      return {
        success: false,
        message: 'Cash in hand entry already exists for today',
        data: existingRecord,
      }
    }

    // Create new record only if none exists today
    const cashEntry = await this.prisma.cashInHand.create({
      data: {
        workerId,
        amount: Number(amount),
      },
    })

    return {
      success: true,
      message: 'Cash in hand entry created successfully',
      data: cashEntry,
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    }
  }
}


@Get('total-amount')
@Roles('WORKER')
async getMyCashInHand(@Request() req) {
  try {
    const workerId = req.user.workerId

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const cashRecord = await this.prisma.cashInHand.findFirst({
      where: {
        workerId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        workerId: true,
        date: true,
        amount: true,       // keep amount
        // actualAmount is intentionally excluded
      },
    })

    return {
      success: true,
      message: 'Cash in hand record fetched successfully',
      data: cashRecord,
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    }
  }
}

}
