import { ApiProperty } from '@nestjs/swagger';

export class BadRequestErrorDto {
  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: '["Invalid image source provided"]',
    type: [String],
  })
  message: string[];

  @ApiProperty({
    description: 'Type of domain error that occurred',
    example: 'InvalidImageSourceError',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: Number,
  })
  statusCode: number;
}

export class NotFoundErrorDto {
  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: '["Task not found"]',
    type: [String],
  })
  message: string[];

  @ApiProperty({
    description: 'Type of domain error that occurred',
    example: 'TaskNotFoundError',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  statusCode: number;
}

export class InternalServerErrorDto {
  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: '["An unexpected error occurred"]',
    type: String,
  })
  message: string[];

  @ApiProperty({
    description: 'Type of domain error that occurred',
    example: 'InternalServerError',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
    type: Number,
  })
  statusCode: number;
}
