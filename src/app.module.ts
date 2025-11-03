import { Module } from '@nestjs/common';

import { TaskModule } from './infrastructure/modules/task.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    TaskModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/image_service',
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
