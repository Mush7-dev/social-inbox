import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SocialPermissionsService } from './social-permissions.service';
import {
  CreateSocialInboxPermissionDto,
  UpdateSocialInboxPermissionDto,
  SocialInboxPermissionResponseDto,
  EffectivePermissionsResponseDto,
} from './dto/social-inbox-permission.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { SocialInboxAccessType } from '../../common/enums/social-platform.enum';
import { UserContext } from './permission-resolver.service';
import { SocialInboxPermissionDocument } from '../../schemas/social-inbox-permission.schema';

interface AuthenticatedRequest extends Request {
  user: UserContext;
}

@ApiTags('Social Permissions')
@ApiBearerAuth()
@Controller('social-permissions')
@UseGuards(AuthGuard)
export class SocialPermissionsController {
  constructor(private readonly permissionsService: SocialPermissionsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user raw permissions',
    description:
      'Returns only individual (user-specific) permissions. Does not include team or role permissions.',
  })
  @ApiResponse({
    status: 200,
    type: SocialInboxPermissionResponseDto,
    description: 'User individual permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'No individual permissions found for user',
  })
  async getMyPermissions(
    @Request() req: AuthenticatedRequest,
  ): Promise<SocialInboxPermissionDocument | null> {
    const userId = req.user._id || req.user.id || '';
    return await this.permissionsService.getMyPermissions(userId);
  }

  @Get('me/effective')
  @ApiOperation({
    summary: 'Get current user effective permissions',
    description:
      'Returns resolved permissions considering individual, team, and role permissions with proper priority (Individual > Team > Role)',
  })
  @ApiResponse({
    status: 200,
    type: EffectivePermissionsResponseDto,
    description: 'Effective permissions across all platforms',
  })
  async getMyEffectivePermissions(
    @Request() req: AuthenticatedRequest,
  ): Promise<EffectivePermissionsResponseDto> {
    return await this.permissionsService.getEffectivePermissions(req.user);
  }

  @Get('effective/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get effective permissions for any user (Admin only)',
    description:
      'Returns resolved permissions for specified user considering all permission sources',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get permissions for',
    example: 'user123',
  })
  @ApiResponse({
    status: 200,
    type: EffectivePermissionsResponseDto,
    description: 'Effective permissions for the user',
  })
  async getEffectivePermissions(
    @Param('userId') userId: string,
  ): Promise<EffectivePermissionsResponseDto> {
    // Note: This requires fetching user details (teams, role) from your CRM
    // For now, we'll just pass the userId and empty arrays
    // You should enhance this to fetch actual user context
    const userContext: UserContext = {
      _id: userId,
      teamIds: [], // TODO: Fetch from CRM
      userType: '', // TODO: Fetch from CRM
    };
    return await this.permissionsService.getEffectivePermissions(userContext);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get all permissions (Admin only)',
    description:
      'Returns all permission records (individual, team, and role-based)',
  })
  @ApiQuery({
    name: 'accessType',
    required: false,
    enum: SocialInboxAccessType,
    description: 'Filter by access type (user, team, or role)',
  })
  @ApiResponse({
    status: 200,
    type: [SocialInboxPermissionResponseDto],
    description: 'List of all permissions',
  })
  async getAllPermissions(
    @Query('accessType') accessType?: string,
  ): Promise<SocialInboxPermissionDocument[]> {
    if (accessType) {
      return await this.permissionsService.getPermissionsByType(
        accessType as SocialInboxAccessType,
      );
    }
    return await this.permissionsService.getAllPermissions();
  }

  @Get('user/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get specific user permissions (Admin only)',
    description: 'Returns individual permissions for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user123',
  })
  @ApiResponse({
    status: 200,
    type: SocialInboxPermissionResponseDto,
    description: 'User permissions',
  })
  @ApiResponse({ status: 404, description: 'Permissions not found' })
  async getUserPermissions(
    @Param('userId') userId: string,
  ): Promise<SocialInboxPermissionDocument> {
    return await this.permissionsService.getUserPermissions(userId);
  }

  @Get('team/:teamId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get team permissions (Admin only)',
    description: 'Returns permissions configured for a specific team',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    example: 'team-sales-001',
  })
  @ApiResponse({
    status: 200,
    type: [SocialInboxPermissionResponseDto],
    description: 'Team permissions',
  })
  async getTeamPermissions(
    @Param('teamId') teamId: string,
  ): Promise<SocialInboxPermissionDocument[]> {
    return await this.permissionsService.getPermissionsByTargetId(teamId);
  }

  @Get('role/:roleName')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get role permissions (Admin only)',
    description:
      'Returns permissions configured for a specific role (e.g., "General Manager")',
  })
  @ApiParam({
    name: 'roleName',
    description: 'Role name',
    example: 'General Manager',
  })
  @ApiResponse({
    status: 200,
    type: [SocialInboxPermissionResponseDto],
    description: 'Role permissions',
  })
  async getRolePermissions(
    @Param('roleName') roleName: string,
  ): Promise<SocialInboxPermissionDocument[]> {
    return await this.permissionsService.getPermissionsByTargetId(roleName);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Create permission (Admin only)',
    description:
      'Create a new permission for user, team, or role. Set accessType to specify the type and targetId for the specific user/team/role.',
  })
  @ApiBody({
    type: CreateSocialInboxPermissionDto,
    examples: {
      user: {
        summary: 'Individual User Permission',
        value: {
          accessType: 'user',
          targetId: 'user123',
          permissions: [
            {
              platform: 'facebook',
              type: 'view_and_answer',
              isDenied: false,
            },
          ],
        },
      },
      userBlock: {
        summary: 'Block User (Explicit Denial)',
        value: {
          accessType: 'user',
          targetId: 'user456',
          permissions: [
            {
              platform: 'facebook',
              type: 'view_only',
              isDenied: true,
            },
          ],
        },
      },
      team: {
        summary: 'Team Permission',
        value: {
          accessType: 'team',
          targetId: 'team-sales-001',
          permissions: [
            {
              platform: 'facebook',
              type: 'view_and_answer',
              isDenied: false,
            },
            {
              platform: 'instagram',
              type: 'view_only',
              isDenied: false,
            },
          ],
        },
      },
      role: {
        summary: 'Role Permission',
        value: {
          accessType: 'role',
          targetId: 'General Manager',
          permissions: [
            {
              platform: 'facebook',
              type: 'view_and_answer',
              isDenied: false,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    type: SocialInboxPermissionResponseDto,
    description: 'Permission created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Permission already exists for this target',
  })
  async createPermission(
    @Body() dto: CreateSocialInboxPermissionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SocialInboxPermissionDocument> {
    const createdById = req.user._id || req.user.id || '';
    return await this.permissionsService.createPermission(dto, createdById);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Update permission (Admin only)',
    description: 'Update an existing permission record',
  })
  @ApiParam({
    name: 'id',
    description: 'Permission record ID',
  })
  @ApiResponse({
    status: 200,
    type: SocialInboxPermissionResponseDto,
    description: 'Permission updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdateSocialInboxPermissionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SocialInboxPermissionDocument> {
    const updatedById = req.user._id || req.user.id || '';
    return await this.permissionsService.updatePermission(id, dto, updatedById);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Delete permission (Admin only)',
    description: 'Soft delete a permission record',
  })
  @ApiParam({
    name: 'id',
    description: 'Permission record ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async deletePermission(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const deletedById = req.user._id || req.user.id || '';
    await this.permissionsService.deletePermission(id, deletedById);
    return { message: 'Permission deleted successfully' };
  }
}
