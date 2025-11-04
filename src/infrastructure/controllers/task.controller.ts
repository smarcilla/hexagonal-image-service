import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateImageProcessingTask } from '../../application/use-cases/create-image-processing-task.use-case';
import { GetImageProcessingTask } from '../../application/use-cases/get-image-processing-task.use-case';
import { CreateTaskOutput } from 'src/application/dtos/create-task.dto';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTask: CreateImageProcessingTask,
    private readonly getImageProcessingTask: GetImageProcessingTask,
  ) {}

  @Post()
  async create(@Body() body: { source: string }): Promise<CreateTaskOutput> {
    const res = await this.createTask.execute({ source: body.source });
    return res;
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    // GetImageProcessingTask lanzará TaskNotFoundException si no existe
    const task = await this.getImageProcessingTask.execute(id);
    return task;
  }
}
