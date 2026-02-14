import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  SocialPlatform,
  SocialInboxPermissionType,
  SocialInboxAccessType,
} from '../common/enums/social-platform.enum';

export type SocialInboxPermissionDocument = SocialInboxPermission & Document;

@Schema({ _id: false })
export class PlatformPermission {
  @Prop({
    required: true,
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  @Prop({
    required: true,
    enum: SocialInboxPermissionType,
    default: SocialInboxPermissionType.VIEW_ONLY,
  })
  type: SocialInboxPermissionType;

  @Prop({
    default: false,
  })
  isDenied: boolean;
}

export const PlatformPermissionSchema =
  SchemaFactory.createForClass(PlatformPermission);

@Schema({
  timestamps: true,
  collection: 'social_inbox_permissions',
})
export class SocialInboxPermission {
  @Prop({
    required: true,
    enum: SocialInboxAccessType,
    default: SocialInboxAccessType.USER,
  })
  accessType: SocialInboxAccessType;

  @Prop({ required: true, index: true })
  targetId: string;

  @Prop({ index: true })
  userId?: string;

  @Prop({ type: [PlatformPermissionSchema], default: [] })
  permissions: PlatformPermission[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdById?: string;

  @Prop()
  updatedById?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const SocialInboxPermissionSchema = SchemaFactory.createForClass(
  SocialInboxPermission,
);

// Compound index for efficient queries
SocialInboxPermissionSchema.index({ accessType: 1, targetId: 1 });
