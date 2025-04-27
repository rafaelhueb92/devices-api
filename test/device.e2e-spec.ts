import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DeviceState } from '../src/device/enums/state.enum';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

describe('DeviceController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let basicAuthCredentials: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: path.join(__dirname, '../.env.test'),
          isGlobal: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dbConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Get credentials from environment
    const username = process.env.APP_USER;
    const password = process.env.APP_PASSWORD;
    basicAuthCredentials = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
  });

  beforeEach(async () => {
    // Clean the database before each test
    await dbConnection.dropDatabase();
  });

  afterAll(async () => {
    await dbConnection.dropDatabase();
    await app.close();
  });

  describe('/devices (POST)', () => {
    it('should create a new device', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: 'Test Device',
          brand: 'Test Brand',
          state: DeviceState.AVAILABLE,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Device');
          expect(res.body.brand).toBe('Test Brand');
          expect(res.body.state).toBe(DeviceState.AVAILABLE);
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: '',
          brand: '',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .send({
          name: 'Test Device',
          brand: 'Test Brand',
          state: DeviceState.AVAILABLE,
        })
        .expect(401);
    });
  });

  describe('/devices (GET)', () => {
    let createdDevice;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: 'Test Device',
          brand: 'Test Brand',
          state: DeviceState.AVAILABLE,
        });
      createdDevice = response.body;
    });

    it('should return all devices', () => {
      return request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].id).toBe(createdDevice.id);
        });
    });

    it('should return a device by id', () => {
      return request(app.getHttpServer())
        .get(`/devices/${createdDevice.id}`)
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdDevice.id);
        });
    });

    it('should return 404 for non-existent device', () => {
      return request(app.getHttpServer())
        .get('/devices/64789a1f99999999999999')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .expect(404);
    });
  });

  describe('/devices/:id (PUT)', () => {
    let deviceId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: 'Test Device',
          brand: 'Test Brand',
          state: DeviceState.AVAILABLE,
        });
      deviceId = response.body.id;
    });

    it('should update a device completely', () => {
      return request(app.getHttpServer())
        .put(`/devices/${deviceId}`)
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: 'Updated Device',
          brand: 'Updated Brand',
          state: DeviceState.IN_USE,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Device');
          expect(res.body.brand).toBe('Updated Brand');
          expect(res.body.state).toBe(DeviceState.IN_USE);
        });
    });
  });

  describe('/devices/:id (DELETE)', () => {
    let deviceId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .send({
          name: 'Test Device',
          brand: 'Test Brand',
          state: DeviceState.AVAILABLE,
        });
      deviceId = response.body.id;
    });

    it('should delete a device', () => {
      return request(app.getHttpServer())
        .delete(`/devices/${deviceId}`)
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent device', () => {
      return request(app.getHttpServer())
        .delete('/devices/64789a1f99999999999999')
        .set('Authorization', `Basic ${basicAuthCredentials}`)
        .expect(404);
    });
  });
});
