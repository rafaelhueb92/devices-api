import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DeviceState } from '../enums/state.enum';
import { BaseSchema } from '../../common/base/base.schema';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({
  timestamps: true,
  collection: 'devices',
  versionKey: false,
})
export class Device extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    index: true,
  })
  brand: string;

  @Prop({
    type: String,
    required: true,
    enum: DeviceState,
    default: DeviceState.AVAILABLE,
    index: true,
  })
  state: DeviceState;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ brand: 1, state: 1 });
