import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialInboxService } from '../social-message/social-inbox.service';
import { SocialPlatform } from '../../common/enums/social-platform.enum';
import { CreateMessageDto } from '../social-message/dto/social-inbox.dto';

interface FacebookUserProfile {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
}

@Injectable()
export class FacebookWebhookService {
  private readonly logger = new Logger(FacebookWebhookService.name);

  constructor(
    private readonly socialInboxService: SocialInboxService,
    private readonly configService: ConfigService,
  ) {}

  // Fetch user profile from Facebook Graph API
  private async fetchUserProfile(
    userId: string,
  ): Promise<FacebookUserProfile | null> {
    console.log(`Fetching profile for user ID: ${userId}`);
    try {
      const accessToken = this.configService.get<string>('FACEBOOK_APP_ID');
      if (!accessToken) {
        this.logger.warn('FACEBOOK_PAGE_ACCESS_TOKEN not configured');
        return null;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${userId}?fields=id,first_name,last_name,name,profile_pic&access_token=${accessToken}`,
      );
      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch profile for user ${userId}: ${response.status}`,
        );
        return null;
      }

      const profile = (await response.json()) as FacebookUserProfile;
      return profile;
    } catch (error) {
      this.logger.error(`Error fetching user profile: ${error.message}`);
      return null;
    }
  }

  // Verify webhook subscription
  verifyWebhook(mode: string, challenge: string, verifyToken: string): string {
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

      // Fetch sender profile from Facebook Graph API
      const senderProfile = await this.fetchUserProfile(senderId);
      console.log('Fetched sender profile:', senderProfile);
      // Create message DTO with nested participant objects
      const createMessageDto: CreateMessageDto = {
        platform,
        sender: {
          id: senderId,
          name: senderProfile?.first_name || senderProfile?.name,
          surname: senderProfile?.last_name,
          avatar: senderProfile?.profile_pic,
        },
        recipient: {
          id: recipientId,
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
