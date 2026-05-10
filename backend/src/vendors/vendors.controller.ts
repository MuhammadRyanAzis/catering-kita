import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { CreateVendorRatingDto } from './dto/create-vendor-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}
  // Get all vendors (public) dengan filter city dan rating
  @Get()
  findAll(@Query() query: QueryVendorDto) {
    return this.vendorsService.findAll(query);
  }

  // Get vendor's orders & statistics (vendor only)
  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  findVendorOrders(
    @CurrentUser('id') userId: number,
  ) {
    return this.vendorsService.findVendorOrders(userId);
  }

  // Get all vendors (admin only)
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllAdmin(@Query() query: QueryVendorDto) {
    return this.vendorsService.findAllAdmin(query);
  }

  // Get vendor detail dengan menus & reviews (public)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  // Update vendor profile (vendor owner only)
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  update(
    @CurrentUser('id') userId: number,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(userId, updateVendorDto);
  } 

  // Update vendor status (admin only)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorStatusDto: UpdateVendorStatusDto,
  ) {
    return this.vendorsService.updateStatus(id, updateVendorStatusDto.is_active);
  }

  // Delete own account (vendor)
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  removeSelf(@CurrentUser('id') userId: number) {
    return this.vendorsService.removeSelf(userId);
  }

  // Delete vendor by ID (admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.remove(id);
  }

  // Get vendor's menus (public)
  @Get(':id/menus')
  findVendorMenus(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findVendorMenus(id);
  }

  // Get vendor ratings (public)
  @Get(':id/ratings')
  findVendorRatings(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findVendorRatings(id);
  }

  // Create or update my vendor rating (customer only)
  @Post(':id/ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  rateVendor(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateVendorRatingDto,
  ) {
    return this.vendorsService.rateVendor(userId, id, dto);
  }
}
