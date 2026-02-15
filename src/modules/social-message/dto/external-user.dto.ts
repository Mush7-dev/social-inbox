import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPlatform } from '../../../common/enums/social-platform.enum';

export class ExternalUserResponseDto {
  @ApiProperty({
    description: 'User ID from social platform',
    example: '1234567890'
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'User surname',
    example: 'Doe'
  })
  surname?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  avatar?: string;

  @ApiProperty({
    enum: SocialPlatform,
    description: 'Social media platform',
    example: SocialPlatform.FACEBOOK
  })
  platform: SocialPlatform;

  @ApiProperty({
    description: 'Timestamp of last message from this user',
    example: '2026-02-14T10:30:00.000Z'
  })
  lastMessageAt: Date;
}

export class GetExternalUsersResponseDto {
  @ApiProperty({
    type: [ExternalUserResponseDto],
    description: 'List of external users'
  })
  users: ExternalUserResponseDto[];

  @ApiProperty({
    description: 'Total count of users for pagination',
    example: 150
  })
  total: number;
}
