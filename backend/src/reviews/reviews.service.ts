import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createReviewDto: CreateReviewDto) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: createReviewDto.orderId },
      include: { review: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (order.customer_id !== customer.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException('Pesanan belum selesai, ulasan hanya untuk pesanan selesai');
    }

    if (order.review) {
      throw new BadRequestException('Ulasan untuk pesanan ini sudah ada');
    }

    const review = await this.prisma.reviews.create({
      data: {
        order_id: order.id,
        customer_id: customer.id,
        vendor_id: order.vendor_id,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    });

    return {
      message: 'Ulasan berhasil dikirim',
      data: review,
    };
  }

  async findAll(userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const reviews = await this.prisma.reviews.findMany({
      where: { customer_id: customer.id },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: reviews,
      total: reviews.length,
    };
  }

  async findAllVendor(userId: number) {
    const vendor = await this.prisma.vendors.findUnique({
      where: { user_id: userId },
      select: { id: true, name: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile tidak ditemukan');
    }

    const reviews = await this.prisma.reviews.findMany({
      where: { vendor_id: vendor.id },
      include: {
        customer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return {
      vendor,
      avgRating: Number(avgRating.toFixed(1)),
      totalRatings: reviews.length,
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        customerName: review.customer.user.name,
      })),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
