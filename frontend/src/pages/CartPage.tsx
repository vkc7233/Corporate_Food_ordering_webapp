import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService, paymentService } from '../services/api';
import { PaymentMethod } from '../types';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, total, restaurantId, restaurantName, updateQuantity, removeItem, clearCart } = useCart();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const canPlaceOrder = can('placeOrder');

  useEffect(() => {
    if (canPlaceOrder) {
      paymentService.getAll()
        .then(res => {
          const methods = res.data.paymentMethods;
          setPaymentMethods(methods);
          const def = methods.find((m: PaymentMethod) => m.is_default);
          if (def) setSelectedPayment(def.id);
        })
        .catch(() => toast.error('Failed to load payment methods'));
    }
  }, [canPlaceOrder]);

  const formatPrice = (price: number) => {
    // Simple currency detection based on restaurant country (we don't have it in cart, use total magnitude)
    return total > 100 ? `₹${price.toFixed(0)}` : `$${price.toFixed(2)}`;
  };

  const handleCreateOrder = async () => {
    if (!restaurantId || items.length === 0) return;
    setIsLoading(true);
    try {
      const orderItems = items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity }));
      const res = await orderService.create({ restaurant_id: restaurantId, items: orderItems, notes });
      toast.success('Order created!');
      
      if (canPlaceOrder && selectedPayment) {
        // Auto-place if user can place orders
        await orderService.place(res.data.order.id, selectedPayment);
        toast.success('Order placed successfully! 🎉');
        clearCart();
        navigate('/orders');
      } else {
        toast.success('Order saved to cart. A manager will place it.');
        clearCart();
        navigate('/orders');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentLabel = (pm: PaymentMethod) => {
    if (pm.type === 'card') return `${pm.details.brand} ••••${pm.details.last4}`;
    if (pm.type === 'upi') return `UPI: ${pm.details.upi_id}`;
    if (pm.type === 'wallet') return `${pm.details.provider}`;
    return pm.type;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items from a restaurant to get started</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart</h1>
      <p className="text-gray-500 text-sm mb-6">From: <strong>{restaurantName}</strong></p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.menu_item_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <button
                  onClick={() => removeItem(item.menu_item_id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-orange-100 hover:bg-orange-200 flex items-center justify-center font-bold text-orange-700 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Special instructions, allergies..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.menu_item_id} className="flex justify-between text-gray-600">
                  <span>{item.name} ×{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          {canPlaceOrder && paymentMethods.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">Payment Method</h3>
              <div className="space-y-2">
                {paymentMethods.map(pm => (
                  <label key={pm.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPayment === pm.id ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value={pm.id}
                      checked={selectedPayment === pm.id}
                      onChange={e => setSelectedPayment(e.target.value)}
                      className="text-orange-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{getPaymentLabel(pm)}</p>
                      <p className="text-xs text-gray-500 capitalize">{pm.type}</p>
                    </div>
                    {pm.is_default && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* RBAC Notice for Members */}
          {!canPlaceOrder && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-700 text-sm">
                <strong>Note:</strong> As a Member, your order will be saved as a cart. A Manager or Admin will place it.
              </p>
            </div>
          )}

          <button
            onClick={handleCreateOrder}
            disabled={isLoading || (canPlaceOrder && !selectedPayment)}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
          >
            {isLoading ? 'Processing...' : canPlaceOrder ? 'Place Order' : 'Save to Cart'}
          </button>

          <button
            onClick={clearCart}
            className="w-full text-gray-500 hover:text-red-500 text-sm py-2 transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
