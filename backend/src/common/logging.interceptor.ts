import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl;
    const headers = req.headers;
    const body = req.body;

    this.logger.log(`Incoming Request: ${method} ${url} -- Headers: ${JSON.stringify(headers)} -- Body: ${JSON.stringify(body)}`);

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap((data) =>
          this.logger.log(`Response: ${method} ${url} -- Status: ${context.switchToHttp().getResponse().statusCode} -- RespBody: ${JSON.stringify(data)} -- ${Date.now() - now}ms`)
        ),
      );
  }
}
