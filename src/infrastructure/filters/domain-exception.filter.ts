import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';
import { InvalidImageSourceError } from '../../domain/errors/invalid-image-source.error';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';

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

    const type = exception.name;

    switch (type) {
      case InvalidImageSourceError.name:
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: exception.message,
          type: exception.constructor.name,
        });
      case TaskNotFoundError.name:
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: exception.message,
          type: exception.constructor.name,
        });
      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal server error',
          type: exception.constructor.name,
        });
    }
  }
}
