# Frontend Integration with Backend

## ✅ Apa yang Sudah Diperbaiki

### 1. **API Service Layer** (`lib/api/`)
- **client.ts** - HTTP client dengan error handling
- **types.ts** - TypeScript types matching backend DTOs
- **auth.service.ts** - Auth methods (register, login, profile)
- Support untuk token management & localStorage

### 2. **Auth Components - FIXED**
#### ❌ Sebelumnya:
```typescript
// Endpoint salah
fetch('/api/auth/register/customer')
fetch('/api/auth/register/vendor')
```

#### ✅ Sekarang:
```typescript
// Menggunakan API service dengan endpoint yang benar
authService.registerCustomer(data) // POST /auth/register dengan role: CUSTOMER
authService.registerVendor(data)   // POST /auth/register dengan role: VENDOR
authService.login(data)            // POST /auth/login
```

### 3. **Pages yang Sudah Dibuat**
- `/` - Landing page dengan customer signup form
- `/signin` - Sign in page
- `/customer/dashboard` - Customer dashboard (protected)
- `/vendor/dashboard` - Vendor dashboard (protected)

### 4. **Features**
- ✅ Authentication flow (register & login)
- ✅ Role-based routing (Customer/Vendor)
- ✅ Token management (localStorage)
- ✅ Protected routes dengan auth check
- ✅ Error handling dengan ApiError
- ✅ Loading states

## 🔧 Environment Setup

File `.env.local` sudah dibuat dengan:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Pastikan backend berjalan di port 3001!**

## 🎯 Data Structure Sesuai Backend

### Customer Registration
```typescript
{
  email: string
  password: string
  name: string
  role: 'CUSTOMER'
  phone: string
  address?: string
  city?: string
}
```

### Vendor Registration
```typescript
{
  email: string
  password: string
  name: string
  role: 'VENDOR'
  vendor_name: string
  vendor_address: string
  vendor_city: string
  vendor_phone: string
  description?: string
}
```

### Login
```typescript
{
  email: string
  password: string
}
```

## 🚀 Cara Test

1. **Start Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Buka http://localhost:3000
   - Register sebagai Customer/Vendor
   - Login dengan kredensial yang sudah dibuat
   - Akan redirect ke dashboard sesuai role

## 📋 TODO: Fitur yang Belum Ada

Komponen frontend masih minimal. Yang masih perlu dibuat:

### High Priority
- [ ] Menu listing & detail pages
- [ ] Vendor listing & detail pages
- [ ] Order form & cart functionality
- [ ] Order history pages

### Medium Priority
- [ ] Customer profile page
- [ ] Vendor profile management
- [ ] Menu management (CRUD) untuk vendor
- [ ] Order status management untuk vendor

### Low Priority
- [ ] Reviews & ratings system
- [ ] Payment integration
- [ ] Search & filter functionality
- [ ] Notifications

## 🔐 Auth Flow

```
User Register/Login
      ↓
API Service → Backend (/auth/register or /auth/login)
      ↓
Receive access_token + user data
      ↓
Store in localStorage
      ↓
Redirect to dashboard based on role
      ↓
Protected pages check token & role
```

## 📖 Cara Menggunakan API Service

```typescript
import { authService, ApiError } from '@/lib/api'

// Register Customer
try {
  const response = await authService.registerCustomer({
    email, password, name, phone, address, city
  })
  authService.setToken(response.access_token)
  authService.setUser(response.user)
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.message, error.status)
  }
}

// Login
const response = await authService.login({ email, password })

// Get Profile
const token = authService.getToken()
const profile = await authService.getProfile(token)

// Logout
authService.logout()
```

## 🎨 Next Steps

Untuk melanjutkan development:

1. **Buat API services** untuk modules lain:
   - `menus.service.ts`
   - `vendors.service.ts`
   - `orders.service.ts`
   - `reviews.service.ts`

2. **Buat komponen UI**:
   - MenuCard, MenuList
   - VendorCard, VendorList
   - OrderForm, OrderCard
   - ReviewCard

3. **Buat pages** sesuai flow aplikasi

4. **Setup state management** (optional: Zustand/Redux)

---

**Status Integrasi Frontend-Backend: ~10% → 40%** ✅

Auth sudah fully integrated! Tinggal fitur-fitur utama lainnya.
