import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SocialInboxService } from '../social-message/social-inbox.service';
import { SocialPlatform } from '../../common/enums/social-platform.enum';
import {
  SocialIntegration,
  SocialIntegrationDocument,
} from '../../schemas/social-integration.schema';
import { CreateMessageDto } from '../social-message/dto/social-inbox.dto';

@Injectable()
export class GmailService implements OnModuleInit {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor(
    private socialInboxService: SocialInboxService,
    @InjectModel(SocialIntegration.name)
    private integrationModel: Model<SocialIntegrationDocument>,
    private configService: ConfigService,
  ) {
    // Initialize OAuth2 client with environment variables
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GMAIL_CLIENT_ID'),
      this.configService.get<string>('GMAIL_CLIENT_SECRET'),
      this.configService.get<string>('GMAIL_REDIRECT_URI'),
    );
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async onModuleInit() {
    await this.loadStoredCredentials();
  }

  // Load credentials from database on startup
  private async loadStoredCredentials(): Promise<void> {
    try {
      const integration = await this.integrationModel.findOne({
        platform: SocialPlatform.GMAIL,
        isActive: true,
      });

      if (integration?.tokenData) {
        this.oauth2Client.setCredentials(integration.tokenData);
        this.logger.log('Gmail credentials loaded from database');
      }
    } catch (error) {
      this.logger.warn('No stored Gmail credentials found');
    }
  }

  // Save credentials to database
  private async saveCredentials(tokens: any): Promise<void> {
    try {
      let integration = await this.integrationModel.findOne({
        platform: SocialPlatform.GMAIL,
      });

      if (integration) {
        integration.accessToken = tokens.access_token;
        integration.refreshToken =
          tokens.refresh_token || integration.refreshToken;
        integration.expiryDate = tokens.expiry_date;
        integration.tokenData = tokens;
        integration.isActive = true;
        await integration.save();
      } else {
        integration = new this.integrationModel({
          platform: SocialPlatform.GMAIL,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          tokenData: tokens,
          isActive: true,
        });
        await integration.save();
      }

      this.logger.log('Gmail credentials saved to database');
    } catch (error) {
      this.logger.error('Error saving Gmail credentials:', error);
    }
  }

  // Generate authorization URL for OAuth2 flow
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Set credentials after OAuth2 callback
  async setCredentials(code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Save tokens to database
      await this.saveCredentials(tokens);
      this.logger.log('Gmail OAuth2 tokens set successfully');
    } catch (error) {
      this.logger.error('Error setting Gmail credentials:', error);
      throw error;
    }
  }

  // Set tokens directly (if you have them stored)
  setTokens(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  // Fetch recent emails and save them as social messages
  async fetchEmails(maxResults = 10): Promise<void> {
    try {
      // List messages
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox is:unread', // Only fetch unread emails in inbox
      });

      const messages = listResponse.data.messages || [];

      for (const message of messages) {
        await this.processMessage(message.id);
      }

      this.logger.log(`Processed ${messages.length} Gmail messages`);
    } catch (error) {
      this.logger.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  // Process individual email message
  private async processMessage(messageId: string): Promise<void> {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = message.data.payload.headers;
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject =
        headers.find((h: any) => h.name === 'Subject')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Extract sender info
      const senderMatch = from.match(/^(.*?)\s*<(.+?)>$/) || [null, from, from];
      const senderName = senderMatch[1]?.trim() || '';
      const senderEmail = senderMatch[2]?.trim() || from;

      // Extract email body
      let messageText = '';
      if (message.data.payload.body?.data) {
        messageText = Buffer.from(
          message.data.payload.body.data,
          'base64',
        ).toString();
      } else if (message.data.payload.parts) {
        // Handle multipart messages
        messageText = this.extractTextFromParts(message.data.payload.parts);
      }

      // Clean up HTML if present (basic cleanup)
      messageText = messageText.replace(/<[^>]*>/g, '').trim();

      // Check if message already exists
      const existingMessage = await this.socialInboxService[
        'messageModel'
      ].findOne({
        messageId: messageId,
        platform: SocialPlatform.GMAIL,
      });

      if (!existingMessage) {
        // Create social message DTO
        const createMessageDto: CreateMessageDto = {
          platform: SocialPlatform.GMAIL,
          sender: {
            id: senderEmail,
            name: senderName || senderEmail,
          },
          recipient: {
            id: 'me', // Gmail user
          },
          messageText: `Subject: ${subject}\n\n${messageText}`,
          messageId: messageId,
          timestamp: new Date(date).getTime() || Date.now(),
          rawPayload: message.data,
          conversationId: message.data.threadId || messageId,
        };

        await this.socialInboxService.createMessage(createMessageDto);
        this.logger.log(`Saved Gmail message: ${subject} from ${from}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Gmail message ${messageId}:`, error);
    }
  }

  // Extract text content from multipart email
  private extractTextFromParts(parts: any[]): string {
    let text = '';

    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString();
      } else if (part.parts) {
        text += this.extractTextFromParts(part.parts);
      }
    }

    return text;
  }

  // Send email reply
  async sendReply(
    to: string,
    subject: string,
    message: string,
    threadId?: string,
  ): Promise<void> {
    try {
      const email = [`To: ${to}`, `Subject: ${subject}`, '', message].join(
        '\n',
      );
      const encodedEmail = Buffer.from(email).toString('base64url');

      const sendOptions: any = {
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      };

      if (threadId) {
        sendOptions.requestBody.threadId = threadId;
      }

      await this.gmail.users.messages.send(sendOptions);
      this.logger.log(`Sent Gmail reply to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending Gmail reply:', error);
      throw error;
    }
  }

  // Mark email as read
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      this.logger.error(
        `Error marking Gmail message as read: ${messageId}`,
        error,
      );
    }
  }

  // Get user profile info
  async getUserProfile(): Promise<any> {
    try {
      const profile = await this.gmail.users.getProfile({
        userId: 'me',
      });
      return profile.data;
    } catch (error) {
      this.logger.error('Error getting Gmail user profile:', error);
      throw error;
    }
  }
}
