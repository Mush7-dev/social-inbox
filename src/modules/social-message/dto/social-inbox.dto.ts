import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SocialPlatform } from '../../../common/enums/social-platform.enum';

export class ParticipantDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class PlatformResponseDto {
  @ApiProperty({ description: 'Platform identifier', example: 'facebook' })
  id: string;

  @ApiProperty({ description: 'Platform display name', example: 'Facebook' })
  name: string;

  @ApiProperty({
    description: 'Platform brand color (hex code)',
    example: '#3B82F6',
  })
  color: string;

  @ApiProperty({ description: 'Number of unread messages', example: 5 })
  unreadCount: number;
}

export class ConversationResponseDto {
  @ApiProperty()
  conversationId: string;

  @ApiProperty({ type: ParticipantDto })
  sender: ParticipantDto;

  @ApiProperty()
  lastMessage: string;

  @ApiProperty()
  lastMessageAt: Date;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  platform: SocialPlatform;
}

export class SentByDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  email?: string;
}

export class MessageResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  platform: SocialPlatform;

  @ApiProperty({ type: ParticipantDto })
  sender: ParticipantDto;

  @ApiProperty({ type: ParticipantDto })
  recipient: ParticipantDto;

  @ApiPropertyOptional()
  messageText?: string;

  @ApiProperty()
  direction: string;

  @ApiProperty()
  timestamp: number;

  @ApiPropertyOptional()
  attachments?: any[];

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: SentByDto })
  sentBy?: SentByDto;
}

export class GetConversationsQueryDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class GetMessagesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  messageText: string;
}

export class SendMessageResponseDto {
  @ApiPropertyOptional()
  message?: MessageResponseDto;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  platformMessageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  error?: string;
}

export class CreateMessageDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ type: ParticipantDto })
  @ValidateNested()
  @Type(() => ParticipantDto)
  sender: ParticipantDto;

  @ApiProperty({ type: ParticipantDto })
  @ValidateNested()
  @Type(() => ParticipantDto)
  recipient: ParticipantDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  rawPayload?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;
}
