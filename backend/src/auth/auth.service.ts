import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto, UserRole } from './dto/register.dto';
import { customers, vendors } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private bcrypt: BcryptService
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, name, role } = registerDto;

      if (role !== UserRole.CUSTOMER && role !== UserRole.VENDOR) {
        throw new BadRequestException('Role harus CUSTOMER atau VENDOR');
      }

      // Check existing email
      const existingUser = await this.prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new ConflictException('Email sudah terdaftar');
      }

      // Hash password
      const hashedPassword = await this.bcrypt.hashPassword(password);

      // Use transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.users.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role
          }
        });

        // Create customer profile if role is USER
        if (role === UserRole.CUSTOMER) {
          const { phone, address, city } = registerDto;

          if (!phone) {
            throw new BadRequestException('Nomor telepon wajib diisi untuk customer');
          }

          // Check existing phone
          const existingPhone = await tx.customers.findUnique({
            where: { phone }
          });

          if (existingPhone) {
            throw new ConflictException('Nomor telepon sudah terdaftar');
          }

          const customer = await tx.customers.create({
            data: {
              user_id: user.id,
              phone,
              address,
              city
            }
          });

          return { user, profile: customer };
        }

        // Create vendor profile if role is VENDOR
        if (role === UserRole.VENDOR) {
          const { 
            vendor_name, 
            vendor_address, 
            vendor_city, 
            vendor_phone, 
            description,
            vendor_image_url,
            vendor_banner_url,
          } = registerDto;

          if (!vendor_name || !vendor_address || !vendor_phone || !vendor_banner_url) {
            throw new BadRequestException('Nama, alamat, telepon, dan banner vendor wajib diisi');
          }

          const vendor = await tx.vendors.create({
            data: {
              user_id: user.id,
              name: vendor_name,
              address: vendor_address,
              city: vendor_city || '',
              phone: vendor_phone,
              description,
              image_url: vendor_image_url,
              banner_url: vendor_banner_url,
            }
          });

          return { user, profile: vendor };
        }

        return { user, profile: null };
      });

      // Generate token
      const token = this.generateToken(result.user);

      return {
        success: true,
        message: 'Registrasi berhasil',
        data: {
          access_token: token,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role
          },
          profile: result.profile
        }
      };

    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error registering user:', error);
      throw new BadRequestException('Terjadi kesalahan saat registrasi');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Find user
      const user = await this.prisma.users.findUnique({
        where: { email }
      });

      if (!user) {
        throw new UnauthorizedException('Email atau password salah');
      }

      // Verify password
      const isPasswordValid = await this.bcrypt.comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Email atau password salah');
      }

      // Get profile based on role
      let profile: customers | vendors | null = null;
      if (user.role === UserRole.CUSTOMER) {
        profile = await this.prisma.customers.findUnique({
          where: { user_id: user.id }
        });
      } else if (user.role === UserRole.VENDOR) {
        profile = await this.prisma.vendors.findUnique({
          where: { user_id: user.id }
        });
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Login berhasil',
        data: {
          access_token: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          profile
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error during login:', error);
      throw new UnauthorizedException('Terjadi kesalahan saat login');
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    try {
      const { old_password, new_password } = changePasswordDto;

      // Get user
      const user = await this.prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // Verify old password
      const isOldPasswordValid = await this.bcrypt.comparePassword(
        old_password, 
        user.password
      );

      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Password lama salah');
      }

      // Hash new password
      const hashedNewPassword = await this.bcrypt.hashPassword(new_password);

      // Update password
      await this.prisma.users.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      return {
        success: true,
        message: 'Password berhasil diubah',
        data: null
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error changing password:', error);
      throw new BadRequestException('Terjadi kesalahan saat mengubah password');
    }
  }

  async getProfile(userId: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          created_at: true
        }
      });

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      let profile: customers | vendors | null = null;
      if (user.role === UserRole.CUSTOMER) {
        profile = await this.prisma.customers.findUnique({
          where: { user_id: userId }
        });
      } else if (user.role === UserRole.VENDOR) {
        profile = await this.prisma.vendors.findUnique({
          where: { user_id: userId }
        });
      }

      return {
        success: true,
        message: 'Profile berhasil diambil',
        data: {
          user,
          profile
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error getting profile:', error);
      throw new BadRequestException('Terjadi kesalahan saat mengambil profile');
    }
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return this.jwt.sign(payload);
  }
}