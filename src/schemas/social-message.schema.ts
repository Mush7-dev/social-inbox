import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  SocialPlatform,
  MessageDirection,
} from '../common/enums/social-platform.enum';

export type SocialMessageDocument = SocialMessage & Document;

@Schema({ _id: false })
export class Participant {
  @Prop({ required: true })
  id: string;

  @Prop()
  name?: string;

  @Prop()
  surname?: string;

  @Prop()
  avatar?: string;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({
  timestamps: true,
  collection: 'social_messages',
})
export class SocialMessage {
  @Prop({ required: true, enum: SocialPlatform, index: true })
  platform: SocialPlatform;

  @Prop({ type: ParticipantSchema, required: true })
  sender: Participant;

  @Prop({ type: ParticipantSchema, required: true })
  recipient: Participant;

  @Prop()
  messageText?: string;

  @Prop()
  messageId?: string;

  @Prop({
    enum: MessageDirection,
    default: MessageDirection.INCOMING,
  })
  direction: MessageDirection;

  @Prop()
  timestamp?: number;

  @Prop({ type: Array, default: [] })
  attachments: any[];

  @Prop({ type: Object })
  rawPayload?: Record<string, any>;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ index: true })
  conversationId?: string;

  @Prop({ default: null })
  deletedAt?: Date;

  @Prop({ type: Object })
  sentBy?: {
    userId: string;
    name?: string;
    email?: string;
  };
}

export const SocialMessageSchema = SchemaFactory.createForClass(SocialMessage);

// Create indexes on nested participant IDs for efficient querying
SocialMessageSchema.index({ 'sender.id': 1 });
SocialMessageSchema.index({ 'recipient.id': 1 });
