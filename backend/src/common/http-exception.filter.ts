import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('Exceptions');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    if (status === 400) {
      this.logger.error(`400 Bad Request on ${request.method} ${request.url}: ${JSON.stringify(errorResponse)}`, exception.stack);
    }

    response.status(status).json(errorResponse);
  }
}
