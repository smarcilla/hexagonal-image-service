import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateImageProcessingTask } from '../../application/use-cases/create-image-processing-task.use-case';
import { GetImageProcessingTask } from '../../application/use-cases/get-image-processing-task.use-case';
import { CreateTaskOutput } from 'src/application/dtos/create-task.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  InternalServerErrorDto,
  NotFoundErrorDto,
} from '../dtos/error-response.dto';
import {
  CreateTaskRequestDto,
  CreateTaskResponseDto,
} from '../dtos/create-task.dto';
import { GetTaskResponseDto } from '../dtos/get-task.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTask: CreateImageProcessingTask,
    private readonly getImageProcessingTask: GetImageProcessingTask,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new image processing task',
    description:
      'Creates a task to process an image from a local path or URL. The image will be resized to 1024px and 800px variants.',
  })
  @ApiBody({ type: CreateTaskRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: CreateTaskResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid image source provided. The source must be a valid file path or URL.',
    type: BadRequestErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error occurred during task creation',
    type: InternalServerErrorDto,
  })
  async create(@Body() body: CreateTaskRequestDto): Promise<CreateTaskOutput> {
    const res = await this.createTask.execute({ source: body.source });
    return res;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get task status and information',
    description:
      'Retrieves the current status, price, and output paths (if completed) for a specific task.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique task identifier',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Task information retrieved successfully',
    type: GetTaskResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Task with the specified ID does not exist',
    type: NotFoundErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error occurred while retrieving task',
    type: InternalServerErrorDto,
  })
  async getTask(@Param('id') id: string): Promise<GetTaskResponseDto> {
    // GetImageProcessingTask lanzará TaskNotFoundException si no existe
    const task = await this.getImageProcessingTask.execute(id);
    return task;
  }
}
