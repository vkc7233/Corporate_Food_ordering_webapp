import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../types';

interface Props {
  children: React.ReactNode;
  permission?: keyof typeof PERMISSIONS;
}

const ProtectedRoute = ({ children, permission }: Props) => {
  const { user, isLoading, can } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !can(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
          <p className="text-sm text-gray-400 mt-2">Your role: <span className="font-semibold capitalize">{user.role}</span></p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
