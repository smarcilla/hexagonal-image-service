import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for retrieving task information
 */
export class GetTaskResponseDto {
  @ApiProperty({
    description: 'Current status of the processing task',
    example: 'completed',
    enum: ['pending', 'completed', 'failed'],
  })
  status: 'pending' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Price assigned to the task',
    example: 25.5,
    type: Number,
    minimum: 5,
    maximum: 50,
  })
  price: number;

  @ApiProperty({
    description:
      'Array of output file paths for processed image variants. Only present when status is completed.',
    example: ['/output/image/1024/abc123.jpg', '/output/image/800/abc123.jpg'],
    type: [String],
    required: false,
  })
  paths?: string[];
}
