import { IsEnum, IsNumber, IsPositive, IsInt } from 'class-validator';

enum PaymentMethodDto {
	cash = 'cash',
	transfer = 'transfer',
	ewallet = 'ewallet',
}

export class CreatePaymentDto {
	@IsInt()
	orderId: number;

	@IsNumber()
	@IsPositive()
	amount: number;

	@IsEnum(PaymentMethodDto)
	payment_method: PaymentMethodDto;
}
