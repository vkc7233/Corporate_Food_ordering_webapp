import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { restaurantService, orderService } from '../services/api';
import { Restaurant, Order } from '../types';

const roleColors: Record<string, string> = {
  admin: 'from-purple-500 to-indigo-600',
  manager: 'from-blue-500 to-cyan-600',
  member: 'from-green-500 to-teal-600',
};

const Dashboard = () => {
  const { user, isAdmin, isManager, can } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restRes, orderRes] = await Promise.all([
          restaurantService.getAll(),
          orderService.getAll(),
        ]);
        setRestaurants(restRes.data.restaurants);
        setOrders(orderRes.data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    restaurants: restaurants.length,
    totalOrders: orders.length,
    activeOrders: orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length,
    cartOrders: orders.filter(o => o.status === 'cart').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className={`bg-gradient-to-r ${roleColors[user?.role || 'member']} rounded-2xl p-6 text-white mb-8`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
            <p className="opacity-80 mt-1 text-sm capitalize">
              {user?.role} • {user?.country || 'Global Access'}
            </p>
          </div>
          <div className="text-6xl opacity-30">🍽️</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Restaurants" value={stats.restaurants} icon="🏪" color="orange" />
        <StatCard label="My Orders" value={stats.totalOrders} icon="📋" color="blue" />
        <StatCard label="Active Orders" value={stats.activeOrders} icon="⚡" color="green" />
        <StatCard label="In Cart" value={stats.cartOrders} icon="🛒" color="yellow" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <QuickAction
          icon="🏪"
          title="Browse Restaurants"
          desc="Explore available restaurants"
          to="/restaurants"
          color="orange"
        />
        {can('createOrder') && (
          <QuickAction
            icon="🛒"
            title="View Cart"
            desc="Review and manage your cart"
            to="/cart"
            color="blue"
          />
        )}
        <QuickAction
          icon="📋"
          title="My Orders"
          desc="Track your orders"
          to="/orders"
          color="green"
        />
        {(isAdmin) && (
          <QuickAction
            icon="💳"
            title="Payment Methods"
            desc="Manage payment options"
            to="/payments"
            color="purple"
          />
        )}
      </div>

      {/* Permissions Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Your Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'viewRestaurants', label: 'View Restaurants', icon: '👀' },
            { key: 'createOrder', label: 'Create Order', icon: '➕' },
            { key: 'placeOrder', label: 'Place Order', icon: '✅' },
            { key: 'cancelOrder', label: 'Cancel Order', icon: '❌' },
            { key: 'updatePaymentMethod', label: 'Manage Payments', icon: '💳' },
          ].map(({ key, label, icon }) => (
            <PermissionBadge
              key={key}
              label={label}
              icon={icon}
              allowed={can(key as any)}
            />
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{order.restaurant_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} · {order.country}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="text-xs text-gray-500 mt-1">
                    ${typeof order.total_amount === 'string' 
                      ? parseFloat(order.total_amount).toFixed(2) 
                      : order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`text-2xl mb-2 w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
};

const QuickAction = ({ icon, title, desc, to, color }: { icon: string; title: string; desc: string; to: string; color: string }) => {
  const borderMap: Record<string, string> = {
    orange: 'hover:border-orange-300 hover:bg-orange-50',
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    green: 'hover:border-green-300 hover:bg-green-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
  };
  return (
    <Link to={to} className={`bg-white rounded-2xl border-2 border-gray-100 p-5 block transition-all ${borderMap[color]} group`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
};

const PermissionBadge = ({ label, icon, allowed }: { label: string; icon: string; allowed: boolean }) => (
  <div className={`rounded-xl p-3 text-center ${allowed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200 opacity-60'}`}>
    <div className="text-xl mb-1">{icon}</div>
    <p className="text-xs font-medium text-gray-700 leading-tight">{label}</p>
    <p className={`text-xs font-bold mt-1 ${allowed ? 'text-green-600' : 'text-gray-400'}`}>
      {allowed ? '✓ Allowed' : '✗ Denied'}
    </p>
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    cart: 'bg-gray-100 text-gray-600',
    placed: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    preparing: 'bg-amber-100 text-amber-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default Dashboard;
