import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialPermissionsService } from './social-permissions.service';
import {
  CreateSocialInboxPermissionDto,
  UpdateSocialInboxPermissionDto,
  SocialInboxPermissionResponseDto,
} from './dto/social-inbox-permission.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Social Permissions')
@ApiBearerAuth()
@Controller('social-permissions')
@UseGuards(AuthGuard)
export class SocialPermissionsController {
  constructor(private readonly permissionsService: SocialPermissionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiResponse({ status: 200, type: SocialInboxPermissionResponseDto })
  async getMyPermissions(@Request() req) {
    const userId = req.user._id || req.user.id;
    return this.permissionsService.getMyPermissions(userId);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all permissions (Admin only)' })
  @ApiResponse({ status: 200, type: [SocialInboxPermissionResponseDto] })
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('user/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get specific user permissions (Admin only)' })
  @ApiResponse({ status: 200, type: SocialInboxPermissionResponseDto })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissions(userId);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create user permissions (Admin only)' })
  @ApiResponse({ status: 201, type: SocialInboxPermissionResponseDto })
  async createPermission(
    @Body() dto: CreateSocialInboxPermissionDto,
    @Request() req,
  ) {
    const createdById = req.user._id || req.user.id;
    return this.permissionsService.createPermission(dto, createdById);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update permissions (Admin only)' })
  @ApiResponse({ status: 200, type: SocialInboxPermissionResponseDto })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdateSocialInboxPermissionDto,
    @Request() req,
  ) {
    const updatedById = req.user._id || req.user.id;
    return this.permissionsService.updatePermission(id, dto, updatedById);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete permissions (Admin only)' })
  @ApiResponse({ status: 200 })
  async deletePermission(@Param('id') id: string, @Request() req) {
    const deletedById = req.user._id || req.user.id;
    await this.permissionsService.deletePermission(id, deletedById);
    return { message: 'Permission deleted successfully' };
  }
}
