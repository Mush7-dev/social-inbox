import { Controller, Get, Post, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GmailService } from './gmail.service';

@ApiTags('Gmail Integration')
@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('auth')
  @ApiOperation({
    summary: 'Get Gmail OAuth URL',
    description:
      'Returns the Google OAuth consent screen URL for Gmail access.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth URL returned successfully',
  })
  async gmailAuth(): Promise<{ authUrl: string }> {
    const authUrl = this.gmailService.getAuthUrl();
    return { authUrl };
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Handle Gmail OAuth callback',
    description: 'Processes OAuth callback and sets up Gmail access.',
  })
  @ApiQuery({ name: 'code', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gmail OAuth completed successfully',
  })
  async gmailCallback(
    @Query('code') code: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.gmailService.setCredentials(code);
      return { success: true, message: 'Gmail OAuth completed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to complete Gmail OAuth' };
    }
  }

  @Post('fetch')
  @ApiOperation({
    summary: 'Fetch Gmail messages',
    description:
      'Fetches recent Gmail messages and saves them to social inbox.',
  })
  @ApiQuery({ name: 'maxResults', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gmail messages fetched successfully',
  })
  async fetchGmailMessages(
    @Query('maxResults') maxResults?: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.gmailService.fetchEmails(maxResults || 10);
      return { success: true, message: 'Gmail messages fetched successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch Gmail messages' };
    }
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get Gmail user profile',
    description: 'Returns the Gmail user profile information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gmail profile retrieved successfully',
  })
  async getGmailProfile(): Promise<{ profile: any }> {
    const profile = await this.gmailService.getUserProfile();
    return { profile };
  }
}
