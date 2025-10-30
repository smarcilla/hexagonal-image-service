import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './infrastructure/modules/task.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TaskModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
