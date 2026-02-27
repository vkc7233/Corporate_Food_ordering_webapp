import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { email: 'nick@shield.com', label: 'Nick Fury', role: 'Admin', country: 'Global', color: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
  { email: 'marvel@shield.com', label: 'Captain Marvel', role: 'Manager', country: '🇮🇳 India', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { email: 'america@shield.com', label: 'Captain America', role: 'Manager', country: '🇺🇸 America', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { email: 'thanos@shield.com', label: 'Thanos', role: 'Member', country: '🇮🇳 India', color: 'bg-green-50 border-green-200 hover:border-green-400' },
  { email: 'thor@shield.com', label: 'Thor', role: 'Member', country: '🇮🇳 India', color: 'bg-green-50 border-green-200 hover:border-green-400' },
  { email: 'travis@shield.com', label: 'Travis', role: 'Member', country: '🇺🇸 America', color: 'bg-green-50 border-green-200 hover:border-green-400' },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setIsLoading(true);
    try {
      await login(demoEmail, 'password123');
      toast.success('Logged in!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left: Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🍽️</div>
            <h1 className="text-3xl font-bold text-gray-900">FoodFlow</h1>
            <p className="text-gray-500 mt-1">Corporate food ordering system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right: Demo accounts */}
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">Quick Demo Login</h2>
          <p className="text-sm text-gray-500 text-center mb-5">Password for all: <code className="bg-gray-100 px-2 py-0.5 rounded">password123</code></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc.email)}
                disabled={isLoading}
                className={`border-2 rounded-xl p-3 text-left transition-all ${acc.color} disabled:opacity-50`}
              >
                <div className="font-semibold text-gray-800 text-sm">{acc.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="font-medium">{acc.role}</span>
                  <span>·</span>
                  <span>{acc.country}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">🔐 RBAC Demo</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• <strong>Admin</strong> (Nick): Full access to everything</li>
              <li>• <strong>Manager</strong>: Can view, create, place & cancel orders (own country)</li>
              <li>• <strong>Member</strong>: Can only view restaurants & create orders</li>
              <li>• <strong>Country isolation</strong>: India & America data are separated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
