import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { WorkerLoginDto } from './dto/worker-login.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('worker-login')
  @HttpCode(HttpStatus.OK)
  async workerLogin(@Body() workerLoginDto: WorkerLoginDto) {
    try {
      const result = await this.authService.workerLogin(workerLoginDto);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        token: null,
        worker: null,
      };
    }
  }

  // ✅ Validate token endpoint (works for both users and workers)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() body: { token: string }) {
    try {
      const user = await this.authService.validateToken(body.token);
      return {
        success: true,
        message: 'Token is valid',
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        user: null,
      };
    }
  }
}
