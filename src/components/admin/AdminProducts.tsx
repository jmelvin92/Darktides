import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { Product } from '../../lib/supabase/database.types';

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const updateTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    short_name: '',
    dosage: '',
    price: 0,
    old_price: undefined,
    stock_quantity: 0,
    sku: '',
    description: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    loadProducts();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('products-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('display_order') as any;
    
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const updateStock = async (productId: string, newQuantity: number) => {
    console.log('Updating stock for product:', productId, 'to', newQuantity);
    
    // Don't update UI here since it's already updated in onChange
    
    const { data, error } = await (supabase
      .from('products') as any)
      .update({ stock_quantity: newQuantity })
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Error updating stock:', error);
      alert(`Error updating stock: ${error.message}`);
      // Revert on error by reloading
      loadProducts();
    } else {
      console.log('Stock updated successfully:', data);
      // Update with the confirmed data from database
      if (data && data[0]) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, ...(data[0] as Product) } : p
        ));
      }
    }
  };

  const toggleActive = async (productId: string, isActive: boolean) => {
    const { error } = await (supabase
      .from('products') as any)
      .update({ is_active: !isActive })
      .eq('id', productId);

    if (!error) {
      loadProducts();
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (!error) {
      loadProducts();
    }
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      short_name: product.short_name,
      dosage: product.dosage,
      price: product.price,
      old_price: product.old_price,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      description: product.description,
      is_active: product.is_active,
      display_order: product.display_order
    });
    setEditingProduct(product);
  };

  const generateSKU = (shortName: string, dosage: string) => {
    // Generate SKU format: DT-SHORTNAME-DOSAGE
    // Example: DT-BPC157-010 for BPC-157 10mg
    const cleanShortName = shortName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanDosage = dosage.replace(/[^0-9]/g, '').padStart(3, '0');
    return `DT-${cleanShortName}-${cleanDosage}`;
  };


  const openAddModal = () => {
    setFormData({
      name: '',
      short_name: '',
      dosage: '',
      price: 0,
      old_price: undefined,
      stock_quantity: 0,
      sku: '',
      description: '',
      is_active: true,
      display_order: products.length
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (editingProduct) {
      // Update existing product
      const { error } = await (supabase
        .from('products') as any)
        .update(formData)
        .eq('id', editingProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        alert(`Error updating product: ${error.message}`);
      } else {
        setEditingProduct(null);
        loadProducts();
      }
    } else {
      // Create new product
      const newProduct = {
        ...formData,
        id: `${formData.short_name?.toLowerCase()}-${Date.now()}`,
      };
      
      const { error } = await (supabase
        .from('products') as any)
        .insert([newProduct]);

      if (error) {
        console.error('Error creating product:', error);
        alert(`Error creating product: ${error.message}`);
      } else {
        setShowAddModal(false);
        loadProducts();
      }
    }
  };

  if (loading) {
    return <div className="text-white">Loading products...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Products</h1>
          <p className="text-sm md:text-base text-gray-400 mt-1">Manage your product inventory</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-neon-blue text-obsidian font-semibold rounded-lg hover:bg-neon-blue/90 transition-colors text-sm md:text-base"
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-charcoal border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock
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
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.dosage}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300 font-mono">{product.sku}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-white">${product.price}</div>
                      {product.old_price && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.old_price}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white font-mono">
                        {product.stock_quantity}
                      </span>
                      {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                        <AlertCircle className="text-yellow-400" size={16} />
                      )}
                      {product.stock_quantity === 0 && (
                        <AlertCircle className="text-red-400" size={16} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-gray-400 hover:text-neon-blue transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
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

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-charcoal border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-gray-400">{product.dosage}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{product.sku}</p>
              </div>
              <button
                onClick={() => toggleActive(product.id, product.is_active)}
                className={`text-xs px-2 py-1 rounded-full ${
                  product.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {product.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-400">Price</p>
                <p className="text-sm text-white">${product.price}</p>
                {product.old_price && (
                  <p className="text-xs text-gray-500 line-through">${product.old_price}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock</p>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-white font-mono">{product.stock_quantity}</span>
                  {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                    <AlertCircle className="text-yellow-400" size={14} />
                  )}
                  {product.stock_quantity === 0 && (
                    <AlertCircle className="text-red-400" size={14} />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(product)}
                className="flex-1 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="px-3 py-2 bg-gray-800 text-red-400 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal border border-gray-800 rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            
            <div className="space-y-4">
              {/* Row 1: Name and Short Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    placeholder="BPC-157 10mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.short_name || ''}
                    onChange={(e) => {
                      const newShortName = e.target.value;
                      setFormData({ 
                        ...formData, 
                        short_name: newShortName,
                        // Auto-generate SKU if creating new product
                        sku: !editingProduct ? generateSKU(newShortName, formData.dosage || '') : formData.sku
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    placeholder="BPC-157"
                  />
                </div>
              </div>

              {/* Row 2: Dosage and SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={formData.dosage || ''}
                    onChange={(e) => {
                      const newDosage = e.target.value;
                      setFormData({ 
                        ...formData, 
                        dosage: newDosage,
                        // Auto-generate SKU if creating new product
                        sku: !editingProduct ? generateSKU(formData.short_name || '', newDosage) : formData.sku
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    placeholder="10 MG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SKU
                    {!editingProduct && (
                      <span className="text-xs text-gray-500 ml-1">(auto-generated)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue ${
                      !editingProduct ? 'bg-gray-900' : 'bg-gray-800'
                    }`}
                    placeholder="DT-BPC-010"
                    readOnly={!editingProduct}
                  />
                </div>
              </div>

              {/* Row 3: Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Current Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Old Price ($)
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.old_price || ''}
                    onChange={(e) => setFormData({ ...formData, old_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity || 0}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  placeholder="Product description..."
                />
              </div>

              {/* Row 4: Display Order and Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  />
                </div>
                <div className="flex items-center sm:pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">
                    Product is Active
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="w-full sm:w-auto px-4 py-2 bg-neon-blue text-obsidian font-semibold rounded hover:bg-neon-blue/90 transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;