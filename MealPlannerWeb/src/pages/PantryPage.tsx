import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pantryService } from '../services/pantry';
import { PantryItem } from '../types';
import { 
  ArchiveBoxIcon, 
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  PencilIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PantryPage: React.FC = () => {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    category: 'Pantry',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: ''
  });

  const categories = [
    'Produce',
    'Dairy & Eggs', 
    'Meat & Seafood',
    'Bakery',
    'Pantry',
    'Frozen',
    'Beverages',
    'Snacks',
    'Other'
  ];

  const commonItems = [
    'Salt', 'Pepper', 'Olive Oil', 'Butter', 'Milk', 'Eggs',
    'Flour', 'Sugar', 'Rice', 'Pasta', 'Onions', 'Garlic'
  ];

  useEffect(() => {
    if (user) {
      loadPantryItems();
    }
  }, [user]);

  const loadPantryItems = async () => {
    try {
      setLoading(true);
      const [items, expiring] = await Promise.all([
        pantryService.getUserPantryItems(user!.uid),
        pantryService.getExpiringItems(user!.uid, 7)
      ]);
      setPantryItems(items);
      setExpiringItems(expiring);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      toast.error('Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newItem: Omit<PantryItem, 'id'> = {
        name: formData.name,
        quantity: formData.quantity,
        category: formData.category,
        purchaseDate: new Date(formData.purchaseDate),
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined
      };

      if (editingItem?.id) {
        await pantryService.updatePantryItem(editingItem.id, newItem);
        toast.success('Item updated successfully');
      } else {
        await pantryService.addPantryItem(user!.uid, newItem);
        toast.success('Item added to pantry');
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      loadPantryItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(editingItem ? 'Failed to update item' : 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from your pantry?')) {
      return;
    }

    try {
      await pantryService.deletePantryItem(itemId);
      toast.success('Item removed from pantry');
      loadPantryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleEditItem = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      purchaseDate: item.purchaseDate.toISOString().split('T')[0],
      expirationDate: item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : ''
    });
    setShowAddModal(true);
  };

  const handleQuickAdd = async (itemName: string) => {
    try {
      await pantryService.addCommonItems(user!.uid, [itemName]);
      toast.success(`${itemName} added to pantry`);
      loadPantryItems();
    } catch (error) {
      console.error('Error quick adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      category: 'Pantry',
      purchaseDate: new Date().toISOString().split('T')[0],
      expirationDate: ''
    });
  };

  const getItemsByCategory = () => {
    const filtered = filterCategory === 'all' 
      ? pantryItems 
      : pantryItems.filter(item => item.category === filterCategory);
    
    const grouped: Record<string, PantryItem[]> = {};
    filtered.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  };

  const getDaysUntilExpiration = (date?: Date) => {
    if (!date) return null;
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (date?: Date) => {
    const days = getDaysUntilExpiration(date);
    if (days === null) return 'text-gray-500';
    if (days <= 0) return 'text-red-600';
    if (days <= 7) return 'text-amber-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pantry Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track what you have at home to reduce waste and save money
            </p>
          </div>

          {/* Expiring Soon Alert */}
          {expiringItems.length > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">
                    Items Expiring Soon
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>{expiringItems.length} items will expire in the next 7 days:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {expiringItems.slice(0, 3).map(item => (
                        <li key={item.id}>
                          {item.name} - expires {item.expirationDate?.toLocaleDateString()}
                        </li>
                      ))}
                      {expiringItems.length > 3 && (
                        <li>...and {expiringItems.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Add */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Common Items</h2>
            <div className="flex flex-wrap gap-2">
              {commonItems.map(item => (
                <button
                  key={item}
                  onClick={() => handleQuickAdd(item)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Filter and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                Filter by:
              </label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setEditingItem(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Item
            </button>
          </div>

          {/* Pantry Items */}
          {pantryItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ArchiveBoxIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your pantry is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start tracking what you have at home to save money and reduce waste
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-green-700 transition-colors"
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(getItemsByCategory()).map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {items.map(item => {
                      const daysUntilExpiration = getDaysUntilExpiration(item.expirationDate);
                      return (
                        <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-base font-medium text-gray-900">
                                {item.name}
                              </h4>
                              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                <span>Qty: {item.quantity}</span>
                                <span className="flex items-center">
                                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                  Added: {item.purchaseDate.toLocaleDateString()}
                                </span>
                                {item.expirationDate && (
                                  <span className={`flex items-center font-medium ${getExpirationColor(item.expirationDate)}`}>
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {daysUntilExpiration! <= 0 
                                      ? 'Expired' 
                                      : `Expires in ${daysUntilExpiration} days`
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id!)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAddModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Edit Item' : 'Add Item to Pantry'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Chicken Breast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 2 lbs, 1 dozen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PantryPage; 