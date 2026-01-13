import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  ShoppingCart, 
  Tag, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import Logo from '../../../components/Logo';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminDiscounts from './AdminDiscounts';

function AdminPanel() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: Home, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/discounts', icon: Tag, label: 'Discount Codes' },
  ];

  return (
    <div className="min-h-screen bg-obsidian flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-teal/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-charcoal/95 backdrop-blur-md border-r border-neon-blue/10 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-neon-blue/10">
            <div className="flex items-center space-x-2">
              <Logo className="w-8 h-8" />
              <p className="text-xs text-neon-blue uppercase tracking-widest">Admin Portal</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-neon-blue transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-neon-blue/20 to-neon-teal/20 text-neon-blue border border-neon-blue/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border hover:border-white/10'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User info & Sign out */}
          <div className="border-t border-neon-blue/10 p-4">
            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neon-blue uppercase tracking-wider">Admin</p>
                <p className="text-sm text-gray-300 truncate font-mono">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-3 p-2 text-gray-400 hover:text-neon-blue transition-colors hover:bg-white/5 rounded-lg"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="bg-charcoal/50 backdrop-blur-md border-b border-neon-blue/10 px-6 py-4 flex items-center lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-neon-blue transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="ml-4 flex items-center space-x-2">
            <Logo className="w-6 h-6" />
            <h1 className="text-lg font-bold text-white tracking-wider">DARKTIDES</h1>
          </div>
        </div>

        {/* Page content with subtle grid background */}
        <main className="flex-1 p-6 relative">
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="h-full w-full" style={{
              backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/discounts" element={<AdminDiscounts />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;