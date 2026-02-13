import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SocialInboxService } from './social-inbox.service';
import { SocialPlatform } from '../../common/enums/social-platform.enum';
import {
  PlatformResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
  SendMessageDto,
  SendMessageResponseDto,
} from './dto/social-inbox.dto';

@ApiTags('Social Inbox')
@Controller('social')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SocialInboxController {
  constructor(private readonly socialInboxService: SocialInboxService) {}

  @Get('platforms')
  @ApiOperation({
    summary: 'Get all social platforms',
    description: 'Returns list of social platforms with unread message counts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platforms retrieved successfully',
  })
  async getPlatforms(): Promise<{ platforms: PlatformResponseDto[] }> {
    const platforms = await this.socialInboxService.getPlatforms();
    return { platforms };
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get conversations for a platform',
    description: 'Returns list of conversations for the specified platform.',
  })
  @ApiQuery({ name: 'platform', enum: SocialPlatform, required: true })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
  })
  async getConversations(
    @Query('platform') platform: SocialPlatform,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ conversations: ConversationResponseDto[]; total: number }> {
    return this.socialInboxService.getConversations(
      platform,
      limit || 50,
      offset || 0,
    );
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Get messages for a conversation',
    description: 'Returns messages for the specified conversation.',
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
  })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ messages: any[]; total: number }> {
    return this.socialInboxService.getMessages(
      conversationId,
      limit || 50,
      offset || 0,
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Send a message to a conversation',
    description: 'Sends a reply message to the specified conversation.',
  })
  @ApiQuery({ name: 'platform', enum: SocialPlatform, required: true })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message sent successfully',
    type: SendMessageResponseDto,
  })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Query('platform') platform: SocialPlatform,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ): Promise<SendMessageResponseDto> {
    try {
      // Get the recipient ID from existing messages in this conversation
      const { messages } = await this.socialInboxService.getMessages(
        conversationId,
        1,
        0,
      );
      const recipientId = messages[0]?.sender?.id || conversationId;

      const message = await this.socialInboxService.sendMessage(
        conversationId,
        platform,
        recipientId,
        dto.messageText,
        req.user,
      );

      return {
        message: message as any,
        success: true,
        platformMessageId: message.messageId,
      };
    } catch (error) {
      return {
        message: undefined,
        success: false,
        error: error.message,
      };
    }
  }

  @Patch('conversations/:conversationId/read')
  @ApiOperation({
    summary: 'Mark conversation as read',
    description: 'Marks all messages in the conversation as read.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation marked as read',
  })
  async markAsRead(
    @Param('conversationId') conversationId: string,
  ): Promise<{ success: boolean }> {
    await this.socialInboxService.markAsRead(conversationId);
    return { success: true };
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({
    summary: 'Mark message as read',
    description: 'Marks a specific message as read.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message marked as read',
  })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
  ): Promise<{ success: boolean }> {
    await this.socialInboxService.markMessageAsRead(messageId);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get total unread count',
    description: 'Returns total unread message count across all platforms.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
  })
  async getTotalUnreadCount(): Promise<{ unreadCount: number }> {
    const unreadCount = await this.socialInboxService.getTotalUnreadCount();
    return { unreadCount };
  }
}
