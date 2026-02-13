import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  SocialPlatform,
  SocialInboxPermissionType,
  SocialInboxAccessType,
} from '../common/enums/social-platform.enum';

export type SocialInboxPermissionDocument = SocialInboxPermission & Document;

@Schema({
  timestamps: true,
  collection: 'social_inbox_permissions',
})
export class SocialInboxPermission {
  @Prop({
    required: true,
    enum: SocialInboxAccessType,
    index: true,
  })
  accessType: SocialInboxAccessType;

  @Prop({ required: true, index: true })
  accessId: string;

  @Prop({
    enum: SocialInboxPermissionType,
    default: SocialInboxPermissionType.VIEW_ONLY,
  })
  permissionType: SocialInboxPermissionType;

  @Prop({
    type: [String],
    enum: SocialPlatform,
    default: [
      SocialPlatform.FACEBOOK,
      SocialPlatform.INSTAGRAM,
      SocialPlatform.WHATSAPP,
      SocialPlatform.GMAIL,
    ],
  })
  platforms: SocialPlatform[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdById?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const SocialInboxPermissionSchema = SchemaFactory.createForClass(
  SocialInboxPermission,
);
