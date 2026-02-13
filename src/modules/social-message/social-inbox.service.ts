import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SocialMessage,
  SocialMessageDocument,
} from '../../schemas/social-message.schema';
import {
  SocialPlatform,
  MessageDirection,
} from '../../common/enums/social-platform.enum';
import { SocialInboxGateway } from './social-inbox.gateway';
import {
  PlatformResponseDto,
  ConversationResponseDto,
  CreateMessageDto,
} from './dto/social-inbox.dto';

@Injectable()
export class SocialInboxService {
  private readonly logger = new Logger(SocialInboxService.name);

  private readonly platformNames: Record<SocialPlatform, string> = {
    [SocialPlatform.FACEBOOK]: 'Facebook',
    [SocialPlatform.INSTAGRAM]: 'Instagram',
    [SocialPlatform.WHATSAPP]: 'WhatsApp',
    [SocialPlatform.GMAIL]: 'Gmail',
  };

  constructor(
    @InjectModel(SocialMessage.name)
    private readonly messageModel: Model<SocialMessageDocument>,
    @Inject(forwardRef(() => SocialInboxGateway))
    private readonly gateway: SocialInboxGateway,
  ) {}

  // Get all platforms with unread counts
  async getPlatforms(): Promise<PlatformResponseDto[]> {
    const platforms = Object.values(SocialPlatform);
    const result: PlatformResponseDto[] = [];

    for (const platform of platforms) {
      const unreadCount = await this.messageModel.countDocuments({
        platform,
        direction: MessageDirection.INCOMING,
        isRead: false,
        deletedAt: null,
      });

      result.push({
        id: platform,
        name: this.platformNames[platform],
        unreadCount,
      });
    }

    return result;
  }

  async getConversations(
    platform: SocialPlatform,
    limit = 50,
    offset = 0,
  ): Promise<{ conversations: ConversationResponseDto[]; total: number }> {
    // MongoDB aggregation to group by sender.id and get latest message
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          platform,
          deletedAt: null,
          direction: MessageDirection.INCOMING,
        },
      },
      {
        $group: {
          _id: '$sender.id',
          sender: { $first: '$sender' },
          conversationId: { $first: '$conversationId' },
          lastMessageAt: { $max: '$createdAt' },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);

    // Get total count
    const totalCount = await this.messageModel.aggregate([
      {
        $match: {
          platform,
          deletedAt: null,
          direction: MessageDirection.INCOMING,
        },
      },
      {
        $group: {
          _id: '$sender.id',
        },
      },
      {
        $count: 'total',
      },
    ]);

    const total = totalCount[0]?.total || 0;
    const result: ConversationResponseDto[] = [];

    for (const conv of conversations) {
      // Get last message
      const lastMsg = await this.messageModel
        .findOne({
          'sender.id': conv.sender.id,
          platform,
          deletedAt: null,
        })
        .sort({ createdAt: -1 });

      // Get unread count
      const unreadCount = await this.messageModel.countDocuments({
        'sender.id': conv.sender.id,
        platform,
        direction: MessageDirection.INCOMING,
        isRead: false,
        deletedAt: null,
      });

      result.push({
        conversationId: conv.conversationId || conv.sender.id,
        sender: {
          id: conv.sender.id,
          name: conv.sender.name || undefined,
          surname: conv.sender.surname || undefined,
          avatar: conv.sender.avatar || undefined,
        },
        lastMessage: lastMsg?.messageText || '[attachment]',
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        platform,
      });
    }

    return { conversations: result, total };
  }

  // Get messages for a conversation
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: SocialMessageDocument[]; total: number }> {
    const query = {
      $or: [
        { conversationId, deletedAt: null },
        { 'sender.id': conversationId, deletedAt: null },
      ],
    };

    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments(query);

    return { messages: messages.reverse(), total };
  }

  // Create a new incoming message
  async createMessage(dto: CreateMessageDto): Promise<SocialMessageDocument> {
    // this.logger.log(`Creating message with DTO: ${JSON.stringify(dto)}`);

    const message = new this.messageModel({
      ...dto,
      direction: MessageDirection.INCOMING,
      conversationId: dto.conversationId || dto.sender.id,
      isRead: false,
    });

    const savedMessage = await message.save();

    // Emit via WebSocket
    this.gateway.sendNewMessage(savedMessage);

    return savedMessage;
  }

  // Send outgoing message (reply)
  async sendMessage(
    conversationId: string,
    platform: SocialPlatform,
    recipientId: string,
    messageText: string,
    crmUser?: { _id?: string; id?: string; name?: string; email?: string },
  ): Promise<SocialMessageDocument> {
    let messageId: string | null = null;
    let sendSuccess = false;

    // TODO: Implement platform API calls
    try {
      switch (platform) {
        case SocialPlatform.FACEBOOK:
          this.logger.log(
            `Sending Facebook message to ${recipientId}: ${messageText}`,
          );
          // TODO: Implement Facebook send API
          break;

        case SocialPlatform.INSTAGRAM:
          this.logger.warn('Instagram send API not implemented yet');
          break;

        case SocialPlatform.WHATSAPP:
          this.logger.warn('WhatsApp send API not implemented yet');
          break;

        case SocialPlatform.GMAIL:
          this.logger.warn('Gmail send API not implemented yet');
          break;

        default:
          this.logger.warn(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send message via ${platform} API: ${error.message}`,
      );
      throw error;
    }

    // Create message record in database
    // For outgoing messages, sender is the page/business, recipient is the user
    const message = new this.messageModel({
      platform,
      sender: {
        id: conversationId,
        // Page/business info would be populated here
      },
      recipient: {
        id: recipientId,
        // Recipient info would be populated from conversation history
      },
      messageText,
      messageId,
      direction: MessageDirection.OUTGOING,
      conversationId,
      isRead: true,
      timestamp: Date.now(),
      rawPayload: sendSuccess
        ? { sent_via_api: true, messageId }
        : { sent_via_api: false },
      sentBy: crmUser
        ? {
            userId: crmUser._id || crmUser.id,
            name: crmUser.name,
            email: crmUser.email,
          }
        : undefined,
    });

    const savedMessage = await message.save();

    // Emit via WebSocket
    this.gateway.sendNewMessage(savedMessage);

    this.logger.log(`Message saved to database with ID: ${savedMessage._id}`);

    return savedMessage;
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        conversationId,
        direction: MessageDirection.INCOMING,
        isRead: false,
      },
      { isRead: true },
    );
  }

  // Mark single message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageModel.findByIdAndUpdate(messageId, { isRead: true });
  }

  // Get unread count for a platform
  async getUnreadCount(platform: SocialPlatform): Promise<number> {
    return this.messageModel.countDocuments({
      platform,
      direction: MessageDirection.INCOMING,
      isRead: false,
      deletedAt: null,
    });
  }

  // Get total unread count across all platforms
  async getTotalUnreadCount(): Promise<number> {
    return this.messageModel.countDocuments({
      direction: MessageDirection.INCOMING,
      isRead: false,
      deletedAt: null,
    });
  }
}
