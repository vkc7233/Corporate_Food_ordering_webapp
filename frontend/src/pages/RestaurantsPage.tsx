import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { restaurantService } from '../services/api';
import { Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    restaurantService.getAll()
      .then(res => setRestaurants(res.data.restaurants))
      .catch(() => toast.error('Failed to load restaurants'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.country ? `Showing ${user.country} restaurants` : 'Showing all restaurants'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.country ? (
            <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium border border-orange-200">
              🌍 {user.country} only
            </span>
          ) : (
            <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium border border-purple-200">
              🌐 Global Access
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search restaurants or cuisine..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-gray-500">No restaurants found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
};

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <Link
    to={`/restaurants/${restaurant.id}`}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group"
  >
    <div className="h-44 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden relative">
      {restaurant.image_url ? (
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-5xl">🍽️</div>
      )}
      <div className="absolute top-3 right-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          restaurant.country === 'India' 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {restaurant.country === 'India' ? '🇮🇳' : '🇺🇸'} {restaurant.country}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-900 text-lg">{restaurant.name}</h3>
      <p className="text-orange-500 text-sm font-medium mt-0.5">{restaurant.cuisine}</p>
      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{restaurant.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{restaurant.menu_item_count || 0} items</span>
        <span className="text-orange-500 text-sm font-medium group-hover:text-orange-600">
          View Menu →
        </span>
      </div>
    </div>
  </Link>
);

const LoadingSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-44 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RestaurantsPage;
