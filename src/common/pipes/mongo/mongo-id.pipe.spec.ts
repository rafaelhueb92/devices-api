import { BadRequestException } from '@nestjs/common';
import { MongoIdPipe } from './mongo-id.pipe';
import { Types } from 'mongoose';

describe('MongoIdPipe', () => {
  let pipe: MongoIdPipe;

  beforeEach(() => {
    pipe = new MongoIdPipe();
  });

  describe('transform', () => {
    it('should return the value if it is a valid ObjectId', () => {
      const validObjectId = new Types.ObjectId().toString();
      expect(pipe.transform(validObjectId)).toBe(validObjectId);
    });

    it('should throw BadRequestException for invalid ObjectId strings', () => {
      const invalidValues = [
        'invalid',
        '123',
        '',
        'abc123',
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd7994390111',
        '507f1f77bcf86cd79943901',
      ];

      invalidValues.forEach((invalidValue) => {
        try {
          pipe.transform(invalidValue);
        } catch (error) {
          expect(error.message).toBe('Invalid ObjectId');
        }
      });
    });

    it('should throw BadRequestException for null or undefined values', () => {
      const nullishValues = [null, undefined];

      nullishValues.forEach((value) => {
        try {
          pipe.transform(value as any);
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe('Invalid ObjectId');
        }
      });
    });

    it('should throw BadRequestException for non-string values', () => {
      const nonStringValues = [123, {}, [], true, false, new Date()];

      nonStringValues.forEach((value) => {
        try {
          pipe.transform(value as any);
        } catch (error) {
          expect(error.message).toBe('Invalid ObjectId');
        }
      });
    });

    it('should accept valid ObjectId strings in different formats', () => {
      const objectId = new Types.ObjectId();
      const validFormats = [objectId.toString(), objectId.toHexString()];

      validFormats.forEach((validFormat) => {
        expect(pipe.transform(validFormat)).toBe(validFormat);
      });
    });
  });
});
