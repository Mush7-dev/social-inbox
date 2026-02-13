import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SocialIntegration,
  SocialIntegrationSchema,
} from '../../schemas/social-integration.schema';
import { SocialMessageModule } from '../social-message/social-message.module';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialIntegration.name, schema: SocialIntegrationSchema },
    ]),
    SocialMessageModule,
  ],
  providers: [GmailService],
  controllers: [GmailController],
  exports: [GmailService],
})
export class GmailModule {}
