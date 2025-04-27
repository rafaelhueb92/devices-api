import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    auto: true,
  })
  _id: string;

  id: string;

  @Prop({
    type: Date,
    default: Date.now,
    immutable: true,
  })
  creationTime: Date;

  @Prop({ type: Date, default: Date.now })
  updatedTime: Date;
}
