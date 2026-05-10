import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, SubscriptionPlanDto } from './dto/create-subscription.dto';

const WIB_TZ = 'Asia/Jakarta';
const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const PLAN_DAYS: Record<string, number> = {
  DAYS_7: 7,
  DAYS_30: 30,
};

function getWibDateString(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function getWibStartDate(date: Date): Date {
  const dateString = getWibDateString(date);
  return new Date(`${dateString}T00:00:00+07:00`);
}

function addWibDays(date: Date, days: number): Date {
  const base = getWibStartDate(date);
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateSubscriptionDto) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const vendor = await this.prisma.vendors.findUnique({
      where: { id: dto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor tidak ditemukan');
    }

    if (!vendor.is_active) {
      throw new BadRequestException('Vendor sedang tidak aktif');
    }

    const planDays = PLAN_DAYS[dto.plan];
    if (!planDays) {
      throw new BadRequestException('Plan langganan tidak valid');
    }

    const totalPrice =
      dto.plan === SubscriptionPlanDto.DAYS_7
        ? vendor.subscription_price_7
        : vendor.subscription_price_30;

    if (totalPrice === null || totalPrice === undefined) {
      throw new BadRequestException('Harga paket langganan belum diset oleh vendor');
    }

    const menus = await this.prisma.menus.findMany({
      where: {
        vendor_id: vendor.id,
        available: true,
      },
      select: { price: true },
    });

    if (menus.length === 0) {
      throw new BadRequestException('Vendor belum memiliki menu aktif');
    }

    const minPrice = Math.min(...menus.map((menu) => Number(menu.price)));
    const totalDeliveries = planDays * 2;
    const budgetPerDelivery = Number(totalPrice) / totalDeliveries;

    if (minPrice > budgetPerDelivery) {
      throw new BadRequestException(
        'Harga paket terlalu rendah untuk menu vendor saat ini',
      );
    }

    const startDate = getWibStartDate(new Date());
    const endDate = addWibDays(startDate, planDays - 1);

    const subscription = await this.prisma.subscriptions.create({
      data: {
        customer_id: customer.id,
        vendor_id: vendor.id,
        plan: dto.plan,
        total_price: totalPrice,
        remaining_budget: totalPrice,
        start_date: startDate,
        end_date: endDate,
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    });

    return {
      message: 'Langganan berhasil dibuat',
      data: subscription,
    };
  }

  async findAll(userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const subscriptions = await this.prisma.subscriptions.findMany({
      where: { customer_id: customer.id },
      include: {
        vendor: { select: { id: true, name: true } },
        subscription_orders: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: subscriptions,
      total: subscriptions.length,
    };
  }

  async findOne(id: number, userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        subscription_orders: {
          include: {
            order: {
              include: {
                order_items: {
                  include: { menu: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription || subscription.customer_id !== customer.id) {
      throw new NotFoundException('Langganan tidak ditemukan');
    }

    return { data: subscription };
  }

  async cancel(id: number, userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription || subscription.customer_id !== customer.id) {
      throw new NotFoundException('Langganan tidak ditemukan');
    }

    const updated = await this.prisma.subscriptions.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return {
      message: 'Langganan berhasil dibatalkan',
      data: updated,
    };
  }

  @Cron('0 0 7 * * *', { timeZone: WIB_TZ })
  async handleMorningGeneration() {
    await this.generateOrdersForSlot('MORNING');
  }

  @Cron('0 0 16 * * *', { timeZone: WIB_TZ })
  async handleAfternoonGeneration() {
    await this.generateOrdersForSlot('AFTERNOON');
  }

  private async generateOrdersForSlot(slot: 'MORNING' | 'AFTERNOON') {
    const serviceDate = getWibStartDate(new Date());

    const subscriptions = await this.prisma.subscriptions.findMany({
      where: {
        status: 'active',
        start_date: { lte: serviceDate },
        end_date: { gte: serviceDate },
      },
    });

    for (const subscription of subscriptions) {
      try {
        const existing = await this.prisma.subscription_orders.findUnique({
          where: {
            subscription_id_service_date_delivery_slot: {
              subscription_id: subscription.id,
              service_date: serviceDate,
              delivery_slot: slot,
            },
          },
        });

        if (existing) {
          continue;
        }

        const planDays = PLAN_DAYS[subscription.plan];
        const totalDeliveries = planDays * 2;
        const usedDeliveries = await this.prisma.subscription_orders.count({
          where: { subscription_id: subscription.id },
        });

        const remainingDeliveries = totalDeliveries - usedDeliveries;
        if (remainingDeliveries <= 0) {
          await this.prisma.subscriptions.update({
            where: { id: subscription.id },
            data: { status: 'completed' },
          });
          continue;
        }

        const remainingBudget = Number(subscription.remaining_budget);
        const budgetPerDelivery = remainingBudget / remainingDeliveries;

        const menus = await this.prisma.menus.findMany({
          where: {
            vendor_id: subscription.vendor_id,
            available: true,
            price: { lte: budgetPerDelivery },
          },
          select: { id: true, price: true },
        });

        if (menus.length === 0) {
          await this.prisma.subscriptions.update({
            where: { id: subscription.id },
            data: {
              status: 'paused',
              pause_reason: 'Budget tidak cukup untuk menu yang tersedia',
            },
          });
          continue;
        }

        const menu = menus[Math.floor(Math.random() * menus.length)];
        const orderTotal = Number(menu.price);
        const nextRemainingBudget = toMoney(remainingBudget - orderTotal);

        const updatedSubscription = await this.prisma.$transaction(async (tx) => {
          const order = await tx.orders.create({
            data: {
              customer_id: subscription.customer_id,
              vendor_id: subscription.vendor_id,
              total: orderTotal,
              delivery_fee: 0,
              notes: `Auto order langganan ${subscription.plan}`,
              order_items: {
                create: [
                  {
                    menu_id: menu.id,
                    quantity: 1,
                    price: menu.price,
                    subtotal: orderTotal,
                  },
                ],
              },
            },
          });

          await tx.subscription_orders.create({
            data: {
              subscription_id: subscription.id,
              order_id: order.id,
              service_date: serviceDate,
              delivery_slot: slot,
            },
          });

          return tx.subscriptions.update({
            where: { id: subscription.id },
            data: {
              remaining_budget: nextRemainingBudget,
            },
          });
        });

        const remainingAfter = totalDeliveries - (usedDeliveries + 1);
        const remainingBudgetAfter = Number(updatedSubscription.remaining_budget);
        if (remainingAfter <= 0 || remainingBudgetAfter <= 0) {
          await this.prisma.subscriptions.update({
            where: { id: subscription.id },
            data: { status: 'completed' },
          });
        }
      } catch (error) {
        this.logger.error(
          `Gagal generate order langganan ${subscription.id} slot ${slot}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}
