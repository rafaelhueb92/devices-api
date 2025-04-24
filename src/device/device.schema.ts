import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DeviceState } from './enums/state.enum';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({
  timestamps: true,
  collection: 'devices',
  versionKey: false,
})
export class Device {
  @Prop({
    type: String,
    index: true,
    unique: true,
  })
  id: string;

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

  @Prop({
    type: Date,
    default: Date.now,
    immutable: true,
  })
  creationTime: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ brand: 1, state: 1 });

DeviceSchema.methods.canUpdate = function (newData: Partial<Device>): boolean {
  return !(
    this.state === DeviceState.IN_USE &&
    (newData.name !== undefined || newData.brand !== undefined)
  );
};
