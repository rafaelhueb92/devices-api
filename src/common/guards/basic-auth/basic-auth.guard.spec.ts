import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BasicAuthGuard } from './basic-auth.guard';

describe('BasicAuthGuard', () => {
  let guard: BasicAuthGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      APP_USER: 'testuser',
      APP_PASSWORD: 'testpass',
    };

    reflector = new Reflector();
    guard = new BasicAuthGuard(reflector);

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when no auth header is present', () => {
      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Missing or invalid Basic Authorization header',
      );
    });

    it('should throw UnauthorizedException when auth header does not start with Basic', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer xyz',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Missing or invalid Basic Authorization header',
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', () => {
      const invalidCredentials = Buffer.from('wronguser:wrongpass').toString(
        'base64',
      );
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Basic ${invalidCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid credentials');
    });

    it('should return true for valid credentials in authorization header', () => {
      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for valid credentials in Authorization header', () => {
      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              Authorization: `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for valid credentials in AUTHORIZATION header', () => {
      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              AUTHORIZATION: `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for valid credentials in x-amzn-authorization header', () => {
      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-amzn-authorization': `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for valid credentials in X-Amzn-Authorization header', () => {
      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'X-Amzn-Authorization': `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException when environment variables are not set', () => {
      delete process.env.APP_USER;
      delete process.env.APP_PASSWORD;

      const validCredentials =
        Buffer.from('testuser:testpass').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Basic ${validCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when credentials are malformed', () => {
      const malformedCredentials = Buffer.from('malformed').toString('base64');
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: `Basic ${malformedCredentials}`,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid credentials');
    });
  });
});
