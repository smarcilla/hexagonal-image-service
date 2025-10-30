/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/infrastructure/filters/domain-exception.filter';

describe('Tasks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // register the domain exception filter (main.ts registers it in bootstrap for real app)
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks - valid source returns id', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ source: '/tmp/example.jpg' })
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Unexpected status ${r.status}`);
      });

    const body = res.body;
    expect(body).toHaveProperty('taskId');
    expect(typeof body.taskId).toBe('string');
  });

  it('POST /tasks - empty source returns 400 with Domain error shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ source: '' })
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('type', 'InvalidImageSourceError');
    expect(res.body).toHaveProperty('error');
  });

  it('POST /tasks - missing source returns 400 with Domain error shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('type', 'InvalidImageSourceError');
  });
});
