import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SocialPlatform } from '../common/enums/social-platform.enum';

export type SocialIntegrationDocument = SocialIntegration & Document;

@Schema({
  timestamps: true,
  collection: 'social_integrations',
})
export class SocialIntegration {
  @Prop({
    required: true,
    enum: SocialPlatform,
    unique: true,
    index: true,
  })
  platform: SocialPlatform;

  @Prop()
  accessToken?: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  expiryDate?: number;

  @Prop()
  email?: string;

  @Prop({ type: Object })
  tokenData?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const SocialIntegrationSchema =
  SchemaFactory.createForClass(SocialIntegration);
