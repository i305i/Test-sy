import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'حدث خطأ داخلي في الخادم';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).error || code;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      // في production: لا نعرض تفاصيل الخطأ الداخلي
      if (isProduction) {
        message = 'حدث خطأ داخلي، يرجى المحاولة لاحقاً';
        code = 'INTERNAL_SERVER_ERROR';
      } else {
        // في development: نعرض التفاصيل للمطورين
        message = exception.message;
        details = {
          stack: exception.stack,
          name: exception.name,
        };
      }
    }

    // Log error (always log full details)
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Response payload
    const errorResponse: any = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Include details only in development
    if (!isProduction && details) {
      errorResponse.error.details = details;
    }

    response.status(status).json(errorResponse);
  }
}

