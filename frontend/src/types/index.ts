export type Role = 'admin' | 'manager' | 'member';
export type Country = 'India' | 'America' | null;
export type OrderStatus = 'cart' | 'placed' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
export type PaymentType = 'card' | 'upi' | 'wallet' | 'bank';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: Country;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  country: string;
  image_url?: string;
  is_active: boolean;
  menu_item_count?: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  image_url?: string;
  is_available: boolean;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_country: string;
  payment_method_id?: string;
  payment_type?: PaymentType;
  payment_details?: Record<string, string>;
  status: OrderStatus;
  total_amount: number | string;
  notes?: string;
  country: string;
  placed_at?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentType;
  details: Record<string, string>;
  is_default: boolean;
  created_at: string;
}

// RBAC permissions helper
export const PERMISSIONS = {
  viewRestaurants: ['admin', 'manager', 'member'],
  createOrder: ['admin', 'manager', 'member'],
  placeOrder: ['admin', 'manager'],
  cancelOrder: ['admin', 'manager'],
  updatePaymentMethod: ['admin'],
} as const;

export const hasPermission = (role: Role, permission: keyof typeof PERMISSIONS): boolean => {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
};
