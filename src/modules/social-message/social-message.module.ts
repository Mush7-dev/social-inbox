import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialMessage, SocialMessageSchema } from '../../schemas/social-message.schema';
import { SocialInboxService } from './social-inbox.service';
import { SocialInboxController } from './social-inbox.controller';
import { SocialInboxGateway } from './social-inbox.gateway';
import { SocialPermissionsModule } from '../social-permissions/social-permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialMessage.name, schema: SocialMessageSchema },
    ]),
    SocialPermissionsModule,
  ],
  providers: [SocialInboxService, SocialInboxGateway],
  controllers: [SocialInboxController],
  exports: [SocialInboxService, SocialInboxGateway],
})
export class SocialMessageModule {}