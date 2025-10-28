import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';
import { InvalidImageSourceError } from '../../domain/errors/invalid-image-source.error';

/**
 * Catches DomainError instances and maps them to HTTP responses.
 * This centralizes mapping of domain errors -> HTTP codes and allows
 * adding new domain error types with custom status codes.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // map known domain types to HTTP statuses
    if (exception instanceof InvalidImageSourceError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: exception.message,
        type: exception.constructor.name,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    const status = HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(status).json({
      statusCode: status,
      error: exception.message,
      type: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
