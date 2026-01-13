import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    is_active: true,
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Loaded discounts:', data);
    
    if (!error && data) {
      setDiscounts(data);
    } else if (error) {
      console.error('Error loading discounts:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    console.log('Submitting discount code:', formData);
    
    if (editingDiscount) {
      const { error } = await supabase
        .from('discount_codes')
        .update({
          code: formData.code,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          is_active: formData.is_active,
        })
        .eq('id', editingDiscount.id);

      if (error) {
        console.error('Error updating discount:', error);
        alert(`Error updating discount: ${error.message}`);
      } else {
        setEditingDiscount(null);
        resetForm();
        loadDiscounts();
      }
    } else {
      const { data, error } = await supabase
        .from('discount_codes')
        .insert([formData]);

      if (error) {
        console.error('Error creating discount:', error);
        alert(`Error creating discount: ${error.message}`);
      } else {
        console.log('Discount created successfully:', data);
        setShowAddModal(false);
        resetForm();
        loadDiscounts();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      is_active: true,
    });
  };

  const toggleActive = async (discountId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !isActive })
      .eq('id', discountId);

    if (!error) {
      loadDiscounts();
    }
  };

  const deleteDiscount = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    
    console.log('Attempting to delete discount:', discountId);
    
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discountId)
        .select();

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Error deleting discount:', error);
        alert(`Error deleting discount: ${error.message}`);
      } else {
        console.log('Discount deleted successfully:', data);
        // Show success feedback
        alert('Discount code deleted successfully!');
        await loadDiscounts();
      }
    } catch (e) {
      console.error('Caught error during delete:', e);
      alert(`Unexpected error: ${e}`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openEditModal = (discount: DiscountCode) => {
    setFormData({
      code: discount.code,
      description: discount.description,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      is_active: discount.is_active,
    });
    setEditingDiscount(discount);
  };

  if (loading) {
    return <div className="text-white">Loading discount codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Discount Codes</h1>
          <p className="text-gray-400 mt-1">Manage promotional and affiliate codes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-neon-blue text-obsidian font-semibold rounded-lg hover:bg-neon-blue/90 transition-colors"
        >
          <Plus size={20} />
          <span>Add Code</span>
        </button>
      </div>

      {/* Discount Codes Table */}
      <div className="bg-charcoal border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description/Affiliate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-white">
                        {discount.code}
                      </span>
                      <button
                        onClick={() => copyCode(discount.code)}
                        className="text-gray-400 hover:text-neon-blue transition-colors"
                      >
                        {copiedCode === discount.code ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{discount.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">
                      {discount.discount_type === 'percentage'
                        ? `${discount.discount_value}%`
                        : `$${discount.discount_value}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">
                      {discount.usage_count} uses
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(discount.id, discount.is_active)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        discount.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(discount)}
                        className="text-gray-400 hover:text-neon-blue transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteDiscount(discount.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingDiscount) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingDiscount ? 'Edit Discount Code' : 'Add Discount Code'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  placeholder="SUMMER20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description/Affiliate
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  placeholder="Instagram - @fitness_influencer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex space-x-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDiscount(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-neon-blue text-obsidian font-semibold rounded hover:bg-neon-blue/90 transition-colors"
              >
                {editingDiscount ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDiscounts;