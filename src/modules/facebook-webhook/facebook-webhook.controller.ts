import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FacebookWebhookService } from './facebook-webhook.service';

@ApiTags('Facebook Webhook')
@Controller('facebook')
export class FacebookWebhookController {
  constructor(private readonly webhookService: FacebookWebhookService) {}

  @Get('webhook')
  @ApiOperation({
    summary: 'Facebook webhook verification',
    description: 'Verifies Facebook webhook subscription.',
  })
  @ApiQuery({ name: 'hub.mode', required: true })
  @ApiQuery({ name: 'hub.challenge', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook verified successfully',
  })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ): Promise<string> {
    return this.webhookService.verifyWebhook(mode, challenge, verifyToken);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Facebook webhook events',
    description: 'Processes incoming Facebook webhook events.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook event processed successfully',
  })
  async handleWebhook(@Body() body: any): Promise<string> {
    await this.webhookService.handleWebhook(body);
    return 'EVENT_RECEIVED';
  }
}
