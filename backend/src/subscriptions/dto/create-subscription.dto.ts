import { IsEnum, IsInt } from 'class-validator';

export enum SubscriptionPlanDto {
  DAYS_7 = 'DAYS_7',
  DAYS_30 = 'DAYS_30',
}

export class CreateSubscriptionDto {
  @IsInt()
  vendorId: number;

  @IsEnum(SubscriptionPlanDto, {
    message: 'Plan harus salah satu dari: DAYS_7, DAYS_30',
  })
  plan: SubscriptionPlanDto;
}
