import React, { useState, useEffect } from 'react';
import { Lock, Plus, Edit2, ToggleLeft, ToggleRight, Copy, X, Check, AlertTriangle } from 'lucide-react';
import { discountService, DiscountCode } from '../../src/lib/services/DiscountService';
import FadeIn from '../FadeIn';

interface DiscountManagerProps {
  onBack: () => void;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form states
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState('');

  // Check session on mount
  useEffect(() => {
    const authSession = sessionStorage.getItem('darktides_admin_auth');
    if (authSession) {
      const { timestamp } = JSON.parse(authSession);
      // Check if session is less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        setIsAuthenticated(true);
        loadDiscounts();
      } else {
        sessionStorage.removeItem('darktides_admin_auth');
      }
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (!adminPassword) {
      setError('Admin password not configured');
      return;
    }

    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('darktides_admin_auth', JSON.stringify({
        timestamp: Date.now()
      }));
      loadDiscounts();
    } else {
      setError('Invalid password');
    }
  };

  const loadDiscounts = async () => {
    setLoading(true);
    const codes = await discountService.getAllDiscountCodes();
    setDiscounts(codes);
    setLoading(false);
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDescription || !newValue) return;

    setLoading(true);
    const result = await discountService.addDiscountCode(
      newCode,
      newDescription,
      newType,
      parseFloat(newValue)
    );

    if (result.success) {
      await loadDiscounts();
      setShowAddForm(false);
      setNewCode('');
      setNewDescription('');
      setNewValue('');
      setNewType('percentage');
    } else {
      setError(result.message || 'Failed to add discount code');
    }
    setLoading(false);
  };

  const toggleDiscount = async (id: string, currentStatus: boolean) => {
    const success = await discountService.toggleDiscountCode(id, !currentStatus);
    if (success) {
      await loadDiscounts();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Not authenticated - show password prompt
  if (!isAuthenticated) {
    return (
      <section className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
        <FadeIn>
          <form onSubmit={handleAuth} className="glass-panel p-12 max-w-md w-full space-y-8 border-t-2 border-t-red-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Admin Access Required</h2>
              <p className="text-gray-500 text-xs text-center font-mono">
                This area is restricted to authorized personnel only
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-red-500 transition-all font-mono"
                autoFocus
              />
              
              {error && (
                <p className="text-red-500 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full bg-red-500/10 border border-red-500 text-red-500 py-4 font-mono text-xs uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all"
              >
                Authenticate
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full text-gray-500 font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Return to Site
              </button>
            </div>
          </form>
        </FadeIn>
      </section>
    );
  }

  // Authenticated - show discount manager
  return (
    <section className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold text-white uppercase tracking-widest mb-2">
                Discount Code Manager
              </h1>
              <p className="text-gray-500 text-xs font-mono">
                Manage affiliate codes and track performance
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors"
            >
              ← Exit Admin
            </button>
          </div>

          {/* Add New Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-8 bg-neon-blue/10 border border-neon-blue text-neon-blue px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-neon-blue hover:text-black transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Discount Code
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <FadeIn>
              <form onSubmit={handleAddDiscount} className="glass-panel p-8 mb-8 border-l-2 border-l-neon-blue">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                    Add New Discount Code
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Discount Code
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="SUMMER20"
                      className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Description / Affiliate
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Instagram - @influencer"
                      className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Discount Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all"
                    >
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount Off</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      Value {newType === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={newType === 'percentage' ? '20' : '10'}
                      step="0.01"
                      min="0"
                      className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-neon-blue text-black px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-neon-blue/90 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-white/5 border border-white/10 text-white px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </FadeIn>
          )}

          {/* Discount Codes Table */}
          <div className="glass-panel overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 font-mono text-xs">
                Loading discount codes...
              </div>
            ) : discounts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-mono text-xs">
                No discount codes yet. Add your first one above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Code</th>
                      <th className="text-left p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Description</th>
                      <th className="text-center p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Type</th>
                      <th className="text-center p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Value</th>
                      <th className="text-center p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Usage</th>
                      <th className="text-center p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="text-right p-4 text-xs font-mono text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((discount) => (
                      <tr key={discount.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-bold">{discount.code}</span>
                            <button
                              onClick={() => copyCode(discount.code)}
                              className="text-gray-500 hover:text-neon-blue transition-colors"
                            >
                              {copiedCode === discount.code ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">{discount.description}</td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-mono text-gray-400">
                            {discount.discount_type === 'percentage' ? 'PERCENT' : 'FIXED'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-white">
                          {discount.discount_type === 'percentage' ? (
                            <span>{discount.discount_value}%</span>
                          ) : (
                            <span>${discount.discount_value}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-neon-blue">{discount.usage_count}</span>
                        </td>
                        <td className="p-4 text-center">
                          {discount.is_active ? (
                            <span className="text-xs font-mono text-green-500">ACTIVE</span>
                          ) : (
                            <span className="text-xs font-mono text-gray-600">INACTIVE</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleDiscount(discount.id, discount.is_active)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title={discount.is_active ? 'Disable' : 'Enable'}
                            >
                              {discount.is_active ? (
                                <ToggleRight className="w-5 h-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {discounts.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-6">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Total Codes</p>
                <p className="text-2xl font-bold text-white">{discounts.length}</p>
              </div>
              <div className="glass-panel p-6">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Active Codes</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {discounts.filter(d => d.is_active).length}
                </p>
              </div>
              <div className="glass-panel p-6">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Total Usage</p>
                <p className="text-2xl font-bold text-green-500">
                  {discounts.reduce((sum, d) => sum + d.usage_count, 0)}
                </p>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </section>
  );
};

export default DiscountManager;