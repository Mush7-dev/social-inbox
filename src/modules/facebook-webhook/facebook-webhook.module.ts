import { Module } from '@nestjs/common';
import { SocialMessageModule } from '../social-message/social-message.module';
import { FacebookWebhookService } from './facebook-webhook.service';
import { FacebookWebhookController } from './facebook-webhook.controller';

@Module({
  imports: [SocialMessageModule],
  providers: [FacebookWebhookService],
  controllers: [FacebookWebhookController],
  exports: [FacebookWebhookService],
})
export class FacebookWebhookModule {}
