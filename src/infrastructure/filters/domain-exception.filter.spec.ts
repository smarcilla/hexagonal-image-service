import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { InvalidImageSourceError } from '../../domain/errors/invalid-image-source.error';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';
import { DomainError } from '../../domain/errors/domain.error';

const createHost = (responseMock: {
  status: jest.Mock;
  json: jest.Mock;
}): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => ({
        status: responseMock.status.mockReturnValue({
          json: responseMock.json,
        }),
      }),
    }),
  }) as unknown as ArgumentsHost;

describe('DomainExceptionFilter (infrastructure)', () => {
  it('maps InvalidImageSourceError to HTTP 400', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost({ status, json });
    const filter = new DomainExceptionFilter();

    filter.catch(new InvalidImageSourceError('bad source'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      message: ['bad source'],
      error: 'InvalidImageSourceError',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('maps TaskNotFoundError to HTTP 404', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost({ status, json });
    const filter = new DomainExceptionFilter();

    filter.catch(new TaskNotFoundError('task-1'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      message: ["Task with id 'task-1' not found"],
      error: 'TaskNotFoundError',
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('defaults to HTTP 500 for other domain errors', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost({ status, json });
    const filter = new DomainExceptionFilter();

    class CustomDomainError extends DomainError {
      constructor() {
        super('custom error');
        this.name = 'CustomDomainError';
      }
    }

    filter.catch(new CustomDomainError(), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal server error',
      type: 'CustomDomainError',
    });
  });
});
