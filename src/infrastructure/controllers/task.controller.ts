import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateImageProcessingTask } from '../../application/use-cases/create-image-processing-task.use-case';
import { GetImageProcessingTask } from '../../application/use-cases/get-image-processing-task.use-case';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTask: CreateImageProcessingTask,
    private readonly getTask: GetImageProcessingTask,
  ) {}

  @Post()
  async create(@Body() body: { source: string }) {
    const res = await this.createTask.execute({ source: body.source });
    return res;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const dto = await this.getTask.execute(id);
    if (!dto) return { found: false };
    return dto;
  }
}
