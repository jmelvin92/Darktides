import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Eye, Download, Check, X } from 'lucide-react';
import type { Order as OrderType } from '../../lib/supabase/database.types';

// Parse the JSON fields from the database order
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: any[];
  subtotal: number;
  shipping: number;
  discount_amount: number;
  discount_code: string;
  total: number;
  status: string;
  notes: string;
  created_at: string;
}

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  useEffect(() => {
    loadOrders();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    console.log('Loading orders...');
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }) as any;

    const { data, error } = await query;
    
    console.log('Orders query result:', { data, error });
    
    if (error) {
      console.error('Error loading orders:', error);
      alert(`Error loading orders: ${error.message}`);
    } else if (data) {
      console.log(`Loaded ${data.length} orders`);
      // Parse the JSON fields from database
      const parsedOrders = data.map((order: OrderType) => {
        const customerData = order.customer_data as any || {};
        const items = order.items as any[] || [];
        return {
          id: order.id,
          order_number: order.order_number,
          customer_name: customerData.name || '',
          customer_email: customerData.email || '',
          customer_phone: customerData.phone || '',
          shipping_address: customerData.shipping_address || '',
          items: items,
          subtotal: customerData.subtotal || 0,
          shipping: customerData.shipping || 0,
          discount_amount: customerData.discount_amount || 0,
          discount_code: customerData.discount_code || '',
          total: order.total,
          status: order.status,
          notes: customerData.notes || '',
          created_at: order.created_at,
        };
      });
      setOrders(parsedOrders);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await (supabase
      .from('orders') as any)
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      loadOrders();
    }
  };

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Date'].join(','),
      ...orders.map(o => [
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.total,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return <div className="text-white">Loading orders...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Orders</h1>
          <p className="text-sm md:text-base text-gray-400 mt-1">Manage customer orders</p>
        </div>
        <button
          onClick={exportOrders}
          className="flex items-center justify-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
        >
          <Download size={18} className="md:w-5 md:h-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'confirmed', 'pending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
              filter === f
                ? 'bg-neon-blue text-obsidian font-semibold'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({orders.filter(o => f === 'all' || o.status === f).length})
          </button>
        ))}
      </div>

      {/* Desktop Table / Mobile Cards */}
      <div className="hidden md:block bg-charcoal border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white font-mono">
                      {order.order_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-white">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">
                      {order.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-white font-semibold">
                        ${order.total.toFixed(2)}
                      </div>
                      {order.discount_code && (
                        <div className="text-xs text-green-400">
                          Code: {order.discount_code}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${
                        order.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-gray-400 hover:text-neon-blue transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-charcoal border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-mono text-white">{order.order_number}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border-0 ${
                  order.status === 'confirmed'
                    ? 'bg-green-500/20 text-green-400'
                    : order.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{order.customer_email}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {order.items?.length || 0} items
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    ${order.total.toFixed(2)}
                  </p>
                  {order.discount_code && (
                    <p className="text-xs text-green-400">
                      Code: {order.discount_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedOrder(order)}
              className="mt-3 w-full py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Eye size={14} />
              <span>View Details</span>
            </button>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal border border-gray-800 rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Order {selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Customer</p>
                  <p className="text-white">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-300">{selectedOrder.customer_email}</p>
                  <p className="text-sm text-gray-300">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Shipping Address</p>
                  <p className="text-white whitespace-pre-line">
                    {selectedOrder.shipping_address}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Items</p>
                <div className="bg-gray-900 rounded p-3 space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="text-gray-300">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-white">${selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Discount ({selectedOrder.discount_code})
                      </span>
                      <span className="text-green-400">
                        -${selectedOrder.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-800">
                    <span className="text-white">Total</span>
                    <span className="text-white">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-xs text-gray-400">Order Notes</p>
                  <p className="text-white mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;