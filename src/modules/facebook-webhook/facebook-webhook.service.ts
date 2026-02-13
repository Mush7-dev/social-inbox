import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialInboxService } from '../social-message/social-inbox.service';
import { SocialPlatform } from '../../common/enums/social-platform.enum';
import { CreateMessageDto } from '../social-message/dto/social-inbox.dto';

@Injectable()
export class FacebookWebhookService {
  private readonly logger = new Logger(FacebookWebhookService.name);

  constructor(
    private readonly socialInboxService: SocialInboxService,
    private readonly configService: ConfigService,
  ) {}

  // Verify webhook subscription
  verifyWebhook(mode: string, challenge: string, verifyToken: string): string {
    console.log(mode, challenge, verifyToken);
    const expectedToken = this.configService.get<string>(
      'FACEBOOK_VERIFY_TOKEN',
    );

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Facebook webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Facebook webhook verification failed');
    throw new BadRequestException('Webhook verification failed');
  }

  // Handle incoming webhook events
  async handleWebhook(body: any): Promise<void> {
    this.logger.log('Received Facebook webhook:', JSON.stringify(body));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        await this.processPageEntry(entry);
      }
    }
  }

  // Process individual page entry
  private async processPageEntry(entry: any): Promise<void> {
    try {
      // Handle messaging events
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          await this.processMessagingEvent(messagingEvent);
        }
      }

      // Handle Instagram messaging events
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Handle Instagram messages
            this.logger.log('Instagram message received');
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing page entry:', error);
    }
  }

  // Process messaging events
  private async processMessagingEvent(messagingEvent: any): Promise<void> {
    const senderId = messagingEvent.sender?.id;
    const recipientId = messagingEvent.recipient?.id;
    const messageData = messagingEvent.message;

    if (!messageData || !senderId || !recipientId) {
      return;
    }

    try {
      // Determine platform based on source
      const platform = SocialPlatform.FACEBOOK; // Could be INSTAGRAM based on source

      // Create message DTO with nested participant objects
      const createMessageDto: CreateMessageDto = {
        platform,
        sender: {
          id: senderId,
          name: messagingEvent.sender?.name,
          surname: messagingEvent.sender?.surname,
          avatar: messagingEvent.sender?.profile_pic,
        },
        recipient: {
          id: recipientId,
          name: messagingEvent.recipient?.name,
          surname: messagingEvent.recipient?.surname,
          avatar: messagingEvent.recipient?.profile_pic,
        },
        messageText: messageData.text,
        messageId: messageData.mid,
        timestamp: messagingEvent.timestamp,
        rawPayload: messagingEvent,
        conversationId: senderId,
        attachments: messageData.attachments || [],
      };

      await this.socialInboxService.createMessage(createMessageDto);
      this.logger.log(`Saved ${platform} message from ${senderId}`);
    } catch (error) {
      this.logger.error('Error processing messaging event:', error);
    }
  }
}
