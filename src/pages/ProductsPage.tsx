import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  FaSearch, 
  FaSignOutAlt, 
  FaSync,
  FaShoppingBag,
  FaList,
  FaUsers,
  FaCog,
  FaChartBar,
  FaShoppingCart,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  sku: string;
}

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, sku')
        .order('name', { ascending: true })

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error loading products:', err.message);
      setError('Chyba pri načítavaní produktov: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  const handleRetry = () => {
    setError(null);
    loadProducts();
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error signing out:', err.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    [product.name, product.sku].some(field =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Načítavajú sa produkty</h3>
          <p className="text-sm text-slate-400">Prosím čakajte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 via-violet-600 to-purple-800 rounded-2xl shadow-lg">
                  <FaShoppingBag className="text-white text-xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Správa produktov
                </h1>
                <p className="text-sm text-slate-400">Katalóg a správa produktov</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-slate-700/50 text-slate-300 font-semibold rounded-xl hover:bg-slate-600/50 transition-all duration-200 border border-slate-600/50 backdrop-blur-sm disabled:opacity-50"
              >
                <FaSync className={`mr-2 text-sm ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Obnovuje sa...' : 'Refresh'}
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                <FaSignOutAlt className="mr-2 text-sm" />
                Odhlásiť
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-300">{error}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRetry}
                  className="text-red-300 hover:text-red-100 text-sm font-medium"
                >
                  Skúsiť znova
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Prehľad', icon: FaChartBar, color: 'from-blue-500 to-cyan-500', path: '/admin' },
              { id: 'products', label: 'Produkty', icon: FaShoppingBag, color: 'from-purple-500 to-violet-500', path: '/admin/products' },
              { id: 'listed-products', label: 'Ponuky', icon: FaList, color: 'from-orange-500 to-amber-500', path: '/admin/listed-products' },
              { id: 'sales', label: 'Predaje', icon: FaShoppingCart, color: 'from-green-500 to-emerald-500', path: '/admin/sales' },
              { id: 'users', label: 'Užívatelia', icon: FaUsers, color: 'from-indigo-500 to-blue-500', path: '/admin/users' },
              { id: 'settings', label: 'Nastavenia', icon: FaCog, color: 'from-gray-500 to-slate-500', path: '/admin/settings' },
            ].map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`relative flex items-center px-6 py-4 font-semibold transition-all duration-300 min-w-max ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-20 rounded-lg`}></div>
                  )}
                  <tab.icon className={`mr-2 text-sm ${isActive ? `text-transparent bg-gradient-to-r ${tab.color} bg-clip-text` : ''}`} />
                  <span className={isActive ? `bg-gradient-to-r ${tab.color} bg-clip-text text-transparent font-bold` : ''}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color} rounded-full`}></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-xl font-bold text-white">Produkty ({filteredProducts.length})</h3>
                <p className="text-slate-400 text-sm mt-1">Správa a prehľad produktov</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Vyhľadať produkty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">IMAGE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Názov</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{product.id}</td>
                    <td className="px-6 py-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                        <img
                          className="h-full w-full object-contain"
                          src={product.image_url || '/default-image.png'}
                          alt={product.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-image.png';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{product.sku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaShoppingBag className="text-slate-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Žiadne produkty</h3>
              <p className="text-slate-400">
                {searchTerm ? 'Nenašli sa žiadne produkty pre váš vyhľadávací výraz' : 'Zatiaľ nie sú pridané žiadne produkty'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}