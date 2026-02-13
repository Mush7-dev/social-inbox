import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SocialPlatform,
  SocialInboxPermissionType,
} from '../../../common/enums/social-platform.enum';

export class PlatformPermissionDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ enum: SocialInboxPermissionType })
  @IsEnum(SocialInboxPermissionType)
  type: SocialInboxPermissionType;
}

export class CreateSocialInboxPermissionDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ type: [PlatformPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformPermissionDto)
  permissions: PlatformPermissionDto[];
}

export class UpdateSocialInboxPermissionDto {
  @ApiPropertyOptional({ type: [PlatformPermissionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformPermissionDto)
  permissions?: PlatformPermissionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SocialInboxPermissionResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [PlatformPermissionDto] })
  permissions: PlatformPermissionDto[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
