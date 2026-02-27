import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, paymentService } from '../services/api';
import { Order, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canPlaceOrder = can('placeOrder');
  const canCancelOrder = can('cancelOrder');

  const fetchOrders = async () => {
    try {
      const res = await orderService.getAll(statusFilter || undefined);
      setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  useEffect(() => {
    if (canPlaceOrder) {
      paymentService.getAll()
        .then(res => {
          const methods = res.data.paymentMethods;
          setPaymentMethods(methods);
          const def = methods.find((m: PaymentMethod) => m.is_default);
          if (def) setSelectedPayment(def.id);
        });
    }
  }, [canPlaceOrder]);

  const handlePlace = async (order: Order) => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }
    setActionLoading(order.id);
    try {
      await orderService.place(order.id, selectedPayment);
      toast.success('Order placed!');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    setActionLoading(orderId);
    try {
      await orderService.cancel(orderId);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading('');
    }
  };

  const formatPrice = (amount: number | string, country?: string) => {
    const p = typeof amount === 'string' ? parseFloat(amount) : amount;
    return country === 'India' ? `₹${p.toFixed(0)}` : `$${p.toFixed(2)}`;
  };

  const getPaymentLabel = (pm: PaymentMethod) => {
    if (pm.type === 'card') return `${pm.details.brand} ••••${pm.details.last4}`;
    if (pm.type === 'upi') return `UPI: ${pm.details.upi_id}`;
    if (pm.type === 'wallet') return pm.details.provider;
    return pm.type;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Status</option>
          <option value="cart">Cart</option>
          <option value="placed">Placed</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">No orders found</p>
          <button
            onClick={() => navigate('/restaurants')}
            className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Start Ordering
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{order.restaurant_name}</h3>
                      <span className="text-xs text-gray-400">
                        {order.country === 'India' ? '🇮🇳' : '🇺🇸'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {user?.role === 'admin' && (
                      <p className="text-xs text-gray-400 mt-1">by {order.user_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="font-bold text-gray-900 mt-1">
                      {formatPrice(order.total_amount, order.country)}
                    </p>
                  </div>
                </div>

                {/* Order items preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-500">
                      {order.items.slice(0, 3).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                      {order.items.length > 3 && ` +${order.items.length - 3} more`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {(canPlaceOrder || canCancelOrder) && (
                  <div className="mt-4 flex items-center gap-2">
                    {canPlaceOrder && order.status === 'cart' && (
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Place Order
                      </button>
                    )}
                    {canCancelOrder && ['cart', 'placed', 'confirmed'].includes(order.status) && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={actionLoading === order.id}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === order.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                )}

                {/* Place order panel */}
                {selectedOrder?.id === order.id && canPlaceOrder && paymentMethods.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-orange-100 bg-orange-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</h4>
                    <div className="space-y-2 mb-3">
                      {paymentMethods.map(pm => (
                        <label key={pm.id} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer text-sm ${
                          selectedPayment === pm.id ? 'border-orange-400 bg-white' : 'border-gray-200 bg-white'
                        }`}>
                          <input
                            type="radio"
                            value={pm.id}
                            checked={selectedPayment === pm.id}
                            onChange={e => setSelectedPayment(e.target.value)}
                          />
                          {getPaymentLabel(pm)}
                          {pm.is_default && <span className="text-xs text-gray-400 ml-auto">Default</span>}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePlace(order)}
                      disabled={actionLoading === order.id}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === order.id ? 'Placing...' : 'Confirm & Place Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
