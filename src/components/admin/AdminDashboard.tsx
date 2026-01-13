import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import type { Product, Order } from '../../lib/supabase/database.types';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load products stats
      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, is_active') as any;
      
      const activeProducts = products?.filter((p: any) => p.is_active) || [];
      const lowStock = activeProducts.filter((p: any) => p.stock_quantity < 5);

      // Load orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }) as any;

      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

      // Get recent orders
      const recent = orders?.slice(0, 5) || [];

      setStats({
        totalProducts: activeProducts.length,
        totalOrders: orders?.length || 0,
        totalRevenue,
        lowStockProducts: lowStock.length,
      });
      setRecentOrders(recent);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-neon-blue text-sm mt-1 uppercase tracking-widest">Research Operations Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-charcoal to-charcoal/50 border border-neon-blue/20 rounded-lg p-6 hover:border-neon-blue/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Active Products</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-neon-blue/10 rounded-lg group-hover:bg-neon-blue/20 transition-colors">
              <Package className="text-neon-blue" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-charcoal to-charcoal/50 border border-neon-teal/20 rounded-lg p-6 hover:border-neon-teal/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Orders</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-neon-teal/10 rounded-lg group-hover:bg-neon-teal/20 transition-colors">
              <ShoppingCart className="text-neon-teal" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-charcoal to-charcoal/50 border border-green-400/20 rounded-lg p-6 hover:border-green-400/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-400/10 rounded-lg group-hover:bg-green-400/20 transition-colors">
              <DollarSign className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-charcoal to-charcoal/50 border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Low Stock Alert</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.lowStockProducts}</p>
              {stats.lowStockProducts > 0 && (
                <p className="text-xs text-yellow-400 mt-1 animate-pulse">Items &lt; 5 units</p>
              )}
            </div>
            <div className="p-3 bg-yellow-400/10 rounded-lg group-hover:bg-yellow-400/20 transition-colors">
              <TrendingUp className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gradient-to-br from-charcoal to-charcoal/50 border border-neon-blue/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-1">Recent Orders</h2>
        <p className="text-xs text-neon-blue uppercase tracking-widest mb-4">Latest Transactions</p>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-400">Order ID</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Customer</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Total</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800">
                    <td className="py-3 text-sm text-white font-mono">
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="py-3 text-sm text-gray-300">
                      {(order.customer_data as any)?.name || 'N/A'}
                    </td>
                    <td className="py-3 text-sm text-white">
                      ${(order.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;