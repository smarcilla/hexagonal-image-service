import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Request DTO for creating an image processing task
 */
export class CreateTaskRequestDto {
  @ApiProperty({
    description: 'Source path or URL of the image to process',
    example: '/path/to/image.jpg',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  source: string;
}

/**
 * Response DTO for created image processing task
 */
export class CreateTaskResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the created task',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  taskId: string;

  @ApiProperty({
    description: 'Random price assigned to the task (between 5 and 50)',
    example: 25.5,
    type: Number,
    minimum: 5,
    maximum: 50,
  })
  price: number;

  @ApiProperty({
    description: 'Current status of the processing task',
    example: 'pending',
    enum: ['pending', 'completed', 'failed'],
  })
  status: 'pending' | 'completed' | 'failed';
}
