jest.mock('@nestjs/throttler', () => ({
  ThrottlerGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return undefined (void) when api is running', () => {
      const result = controller.check();
      expect(result).toBeUndefined();
    });
  });
});
