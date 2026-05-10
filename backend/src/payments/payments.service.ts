import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createPaymentDto: CreatePaymentDto) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: createPaymentDto.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (order.customer_id !== customer.id) {
      throw new BadRequestException('Anda tidak memiliki akses ke pesanan ini');
    }

    if (order.payment) {
      return {
        message: 'Pembayaran sudah tercatat untuk pesanan ini',
        data: order.payment,
      };
    }

    const payment = await this.prisma.payments.create({
      data: {
        order_id: order.id,
        amount: order.total,
        payment_method: createPaymentDto.payment_method,
        status: 'paid',
        paid_at: new Date(),
      },
    });

    return {
      message: 'Pembayaran berhasil dicatat',
      data: payment,
    };
  }

  async findAllCustomer(userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const payments = await this.prisma.payments.findMany({
      where: {
        order: {
          customer_id: customer.id,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            vendor: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        created_at: payment.created_at,
        vendor: payment.order?.vendor ? { name: payment.order.vendor.name } : null,
      })),
      total: payments.length,
    };
  }

  async findAllAdmin() {
    const payments = await this.prisma.payments.findMany({
      include: {
        order: {
          select: {
            id: true,
            total: true,
            customer: { select: { user: { select: { name: true, email: true } } } },
            vendor: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        vendor: payment.order?.vendor ? { name: payment.order.vendor.name } : null,
        customer: payment.order?.customer?.user
          ? {
              name: payment.order.customer.user.name,
              email: payment.order.customer.user.email,
            }
          : null,
      })),
      total: payments.length,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
