import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SocialInboxPermission,
  SocialInboxPermissionDocument,
} from '../../schemas/social-inbox-permission.schema';
import {
  CreateSocialInboxPermissionDto,
  UpdateSocialInboxPermissionDto,
} from './dto/social-inbox-permission.dto';

@Injectable()
export class SocialPermissionsService {
  private readonly logger = new Logger(SocialPermissionsService.name);

  constructor(
    @InjectModel(SocialInboxPermission.name)
    private permissionModel: Model<SocialInboxPermissionDocument>,
  ) {}

  async getMyPermissions(
    userId: string,
  ): Promise<SocialInboxPermissionDocument | null> {
    const permission = await this.permissionModel.findOne({
      userId,
      isActive: true,
      deletedAt: null,
    });

    return permission;
  }

  async getUserPermissions(
    userId: string,
  ): Promise<SocialInboxPermissionDocument> {
    const permission = await this.permissionModel.findOne({
      userId,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permissions not found for user: ${userId}`);
    }

    return permission;
  }

  async getAllPermissions(): Promise<SocialInboxPermissionDocument[]> {
    return this.permissionModel.find({ deletedAt: null }).exec();
  }

  async createPermission(
    dto: CreateSocialInboxPermissionDto,
    createdById: string,
  ): Promise<SocialInboxPermissionDocument> {
    const existing = await this.permissionModel.findOne({
      userId: dto.userId,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException(
        `Permissions already exist for user: ${dto.userId}`,
      );
    }

    const permission = new this.permissionModel({
      ...dto,
      createdById,
    });

    await permission.save();
    this.logger.log(`Created permissions for user: ${dto.userId}`);

    return permission;
  }

  async updatePermission(
    id: string,
    dto: UpdateSocialInboxPermissionDto,
    updatedById: string,
  ): Promise<SocialInboxPermissionDocument> {
    const permission = await this.permissionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${id}`);
    }

    if (dto.permissions !== undefined) {
      permission.permissions = dto.permissions;
    }

    if (dto.isActive !== undefined) {
      permission.isActive = dto.isActive;
    }

    permission.updatedById = updatedById;
    await permission.save();

    this.logger.log(`Updated permissions: ${id}`);
    return permission;
  }

  async deletePermission(id: string, deletedById: string): Promise<void> {
    const permission = await this.permissionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${id}`);
    }

    permission.deletedAt = new Date();
    permission.updatedById = deletedById;
    await permission.save();

    this.logger.log(`Deleted permissions: ${id}`);
  }
}
