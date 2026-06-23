import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carbs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  protein?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fiber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sugar?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sodium?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  water?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vitamins?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  minerals?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
