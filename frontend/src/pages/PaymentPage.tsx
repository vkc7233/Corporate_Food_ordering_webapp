import React, { useEffect, useState } from 'react';
import { paymentService } from '../services/api';
import { PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { can } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'card', is_default: false, last4: '', brand: 'Visa', holder: '', upi_id: '', provider: '' });

  const canModify = can('updatePaymentMethod');

  const fetchMethods = async () => {
    try {
      const res = await paymentService.getAll();
      setMethods(res.data.paymentMethods);
    } catch {
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const buildDetails = () => {
    if (form.type === 'card') return { last4: form.last4, brand: form.brand, holder: form.holder };
    if (form.type === 'upi') return { upi_id: form.upi_id };
    if (form.type === 'wallet') return { provider: form.provider };
    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { type: form.type, details: buildDetails(), is_default: form.is_default };
      if (editingId) {
        await paymentService.update(editingId, data);
        toast.success('Payment method updated');
      } else {
        await paymentService.create(data);
        toast.success('Payment method added');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ type: 'card', is_default: false, last4: '', brand: 'Visa', holder: '', upi_id: '', provider: '' });
      fetchMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment method?')) return;
    try {
      await paymentService.delete(id);
      toast.success('Deleted');
      fetchMethods();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await paymentService.update(id, { is_default: true });
      toast.success('Set as default');
      fetchMethods();
    } catch {
      toast.error('Failed to update');
    }
  };

  const getMethodLabel = (pm: PaymentMethod) => {
    if (pm.type === 'card') return `${pm.details.brand} ••••${pm.details.last4}`;
    if (pm.type === 'upi') return `UPI: ${pm.details.upi_id}`;
    if (pm.type === 'wallet') return pm.details.provider;
    return pm.type;
  };

  const typeIcon: Record<string, string> = {
    card: '💳', upi: '📱', wallet: '👜', bank: '🏦',
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
        {canModify && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            + Add New
          </button>
        )}
      </div>

      {!canModify && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-700 text-sm">Only Admins can add or modify payment methods.</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && canModify && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">{editingId ? 'Edit' : 'Add'} Payment Method</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="upi">UPI</option>
                <option value="wallet">Wallet</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {form.type === 'card' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Brand</label>
                    <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option>Visa</option><option>Mastercard</option><option>Amex</option><option>RuPay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 digits</label>
                    <input value={form.last4} onChange={e => setForm({ ...form, last4: e.target.value })}
                      maxLength={4} placeholder="4242"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input value={form.holder} onChange={e => setForm({ ...form, holder: e.target.value })}
                    placeholder="Nick Fury"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                </div>
              </>
            )}

            {form.type === 'upi' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })}
                  placeholder="name@upi"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
              </div>
            )}

            {form.type === 'wallet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
                  placeholder="PayPal"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })}
                className="rounded text-orange-500" />
              <span className="text-sm text-gray-700">Set as default payment method</span>
            </label>

            <div className="flex gap-3">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
                {editingId ? 'Update' : 'Add'} Method
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {methods.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-gray-500">No payment methods yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map(pm => (
            <div key={pm.id} className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${pm.is_default ? 'border-orange-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcon[pm.type] || '💳'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{getMethodLabel(pm)}</p>
                    <p className="text-xs text-gray-500 capitalize">{pm.type}</p>
                  </div>
                  {pm.is_default && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Default</span>
                  )}
                </div>
                {canModify && (
                  <div className="flex items-center gap-2">
                    {!pm.is_default && (
                      <button onClick={() => handleSetDefault(pm.id)}
                        className="text-xs text-gray-500 hover:text-orange-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => handleDelete(pm.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                      Delete
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

export default PaymentPage;
