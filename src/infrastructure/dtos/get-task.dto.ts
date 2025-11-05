import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for retrieving task information
 */
export class GetTaskResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the processing task',
    example: 'nisgqja',
  })
  taskId: string;

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
    description: 'List of processed image variants',
    example: [
      { resolution: '800', path: '/images/nisgqja-800.jpg' },
      { resolution: '1024', path: '/images/nisgqja-1024.jpg' },
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        resolution: {
          type: 'string',
          description: 'Resolution of the image variant',
          example: '800',
        },
        path: {
          type: 'string',
          description: 'File path of the image variant',
          example: 'images/image/800/70036078a8c80f735aaf05306f30e183.png',
        },
      },
    },
  })
  images: { resolution: string; path: string }[];
}
