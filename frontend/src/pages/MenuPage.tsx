import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../services/api';
import { Restaurant, MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const MenuPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items: cartItems, restaurantId: cartRestaurantId } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuByCategory, setMenuByCategory] = useState<Record<string, MenuItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    restaurantService.getRestaurant 
    restaurantService.getById(id)
      .then(res => {
        setRestaurant(res.data.restaurant);
        setMenu(res.data.restaurant.menu || []);
        const byCategory = res.data.restaurant.menuByCategory || {};
        setMenuByCategory(byCategory);
        const cats = Object.keys(byCategory);
        if (cats.length > 0) setActiveCategory(cats[0]);
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load menu');
        navigate('/restaurants');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const getCartQuantity = (menuItemId: string) => {
    const item = cartItems.find(i => i.menu_item_id === menuItemId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    addItem(item, restaurant.id, restaurant.name);
    toast.success(`${item.name} added to cart!`, { icon: '🛒' });
  };

  const formatPrice = (price: number | string) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return restaurant?.country === 'India' ? `₹${p.toFixed(0)}` : `$${p.toFixed(2)}`;
  };

  const categories = Object.keys(menuByCategory);

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!restaurant) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 relative">
          {restaurant.image_url && (
            <img 
              src={restaurant.image_url} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-white/80 mt-1">{restaurant.cuisine} · {restaurant.address}</p>
          </div>
          <div className="absolute top-4 right-4">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${
              restaurant.country === 'India' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {restaurant.country === 'India' ? '🇮🇳' : '🇺🇸'} {restaurant.country}
            </span>
          </div>
        </div>
      </div>

      {/* Cart banner */}
      {cartRestaurantId === restaurant.id && cartItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-orange-700 font-medium">
            🛒 {cartItems.reduce((s, i) => s + i.quantity, 0)} items in cart
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            View Cart →
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Category sidebar */}
        {categories.length > 1 && (
          <div className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Categories</h3>
              <nav className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                    <span className="ml-1 text-xs text-gray-400">({menuByCategory[cat].length})</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="flex-1 space-y-8">
          {categories.map(category => (
            <div key={category} id={`cat-${category}`}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>{category}</span>
                <span className="text-sm font-normal text-gray-400">({menuByCategory[category].length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuByCategory[category].map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getCartQuantity(item.id)}
                    onAdd={() => handleAddToCart(item)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MenuItemCard = ({ item, quantity, onAdd, formatPrice }: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  formatPrice: (p: number | string) => string;
}) => (
  <div className={`bg-white rounded-2xl border shadow-sm p-4 flex justify-between gap-3 transition-all ${
    quantity > 0 ? 'border-orange-200' : 'border-gray-100 hover:border-gray-200'
  } ${!item.is_available ? 'opacity-50' : ''}`}>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">{item.name}</h4>
      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
      <p className="text-orange-600 font-bold mt-2">{formatPrice(item.price)}</p>
      {!item.is_available && (
        <span className="text-xs text-red-500 font-medium">Unavailable</span>
      )}
    </div>
    <div className="flex flex-col items-end justify-between shrink-0">
      {quantity > 0 && (
        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
          ×{quantity}
        </span>
      )}
      <button
        onClick={onAdd}
        disabled={!item.is_available}
        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-lg font-bold"
      >
        +
      </button>
    </div>
  </div>
);

export default MenuPage;
