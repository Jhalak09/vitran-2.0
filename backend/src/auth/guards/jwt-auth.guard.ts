import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const token = this.extractTokenFromHeader(request);

  if (!token) {
    throw new UnauthorizedException('No token provided');
  }

  try {
    // Validate token and get user/worker info
    const user = await this.authService.validateToken(token);

    // Attach user info to request object
    request.user = user;

    return true;
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired token');
  }
}

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
