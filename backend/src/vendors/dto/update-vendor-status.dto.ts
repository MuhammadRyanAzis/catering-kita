import { IsBoolean } from 'class-validator';

export class UpdateVendorStatusDto {
  @IsBoolean()
  is_active: boolean;
}
