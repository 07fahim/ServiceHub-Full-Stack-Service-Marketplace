export type UserRole = 'admin' | 'vendor' | 'end_user'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface VendorProfile {
  id: string
  user_id: string
  business_name: string
  description: string | null
  address: string | null
  is_verified: boolean
  created_at: string
}

export interface Service {
  id: string
  vendor_id: string
  category_id: string | null
  name: string
  description: string | null
  price: string
  duration_minutes: number | null
  is_active: boolean
  created_at: string
  vendor?: VendorProfile
  category?: Category
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  service_id: string | null
  vendor_id: string | null
  status: OrderStatus
  scheduled_at: string | null
  address: string | null
  notes: string | null
  total_amount: string
  created_at: string
}

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export interface Transaction {
  id: string
  order_id: string
  stripe_payment_intent_id: string | null
  amount: string
  currency: string
  status: TransactionStatus
  created_at: string
}
