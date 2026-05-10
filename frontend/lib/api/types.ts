// API Types matching backend DTOs

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN'
}

// Auth Types
export interface RegisterCustomerDto {
  email: string;
  password: string;
  name: string;
  role: UserRole.CUSTOMER;
  phone: string;
  address?: string;
  city?: string;
}

export interface RegisterVendorDto {
  email: string;
  password: string;
  name: string;
  role: UserRole.VENDOR;
  vendor_name: string;
  vendor_address: string;
  vendor_city: string;
  vendor_phone: string;
  description?: string;
  vendor_image_url?: string;
  vendor_banner_url: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
  access_token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  customer?: {
    id: number;
    phone: string;
    address?: string;
    city?: string;
  };
  vendor?: {
    id: number;
    name: string;
    description?: string;
    address: string;
    city: string;
    phone: string;
    image_url?: string;
    banner_url?: string;
    is_active: boolean;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Menu Types
export interface Menu {
  id: number;
  vendor_id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  calories?: number;
  image_url?: string;
  available: boolean;
  avgRating?: number;
  totalRatings?: number;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  category?: Category;
}

export interface CreateMenuDto {
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  calories?: number;
  image_url?: string;
  available?: boolean;
}

// Vendor Types
export interface Vendor {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  image_url?: string;
  banner_url?: string;
  subscription_price_7?: number;
  subscription_price_30?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  menus?: Menu[];
  reviews?: Review[];
  averageRating?: number;
  totalRatings?: number;
}

// Order Types
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  menu_id: number;
  quantity: number;
  price?: number;
}

export interface CreateOrderDto {
  vendor_id: number;
  items: OrderItem[];
  notes?: string;
  delivery_fee?: number;
}

export interface Order {
  id: number;
  customer_id: number;
  vendor_id: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  delivery_fee: number;
  created_at: string;
  updated_at: string;
  order_items: {
    id: number;
    menu_id: number;
    quantity: number;
    price: number;
    subtotal: number;
    menu: Menu;
  }[];
  vendor: Vendor;
  customer?: {
    id: number;
    phone: string;
    user: {
      name: string;
      email: string;
    };
  };
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Review Types
export interface Review {
  id: number;
  order_id: number;
  customer_id: number;
  vendor_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  customer?: {
    user: {
      name: string;
    };
  };
}

export interface CreateReviewDto {
  order_id: number;
  vendor_id: number;
  rating: number;
  comment?: string;
}

// Payment Types
export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  E_WALLET = 'e_wallet'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}
