import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealPlanService } from '../services/mealPlan';
import { groceryService } from '../services/grocery';
// import { pantryService } from '../services/pantry'; // Hidden for now
import { GroceryItem, GroceryList } from '../types';
import { 
  ShoppingCartIcon, 
  CheckCircleIcon,
  PrinterIcon,
  CurrencyDollarIcon,
  // ArchiveBoxIcon, // Hidden for now
  TruckIcon,
  ShareIcon,
  SparklesIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ShoppingModal from '../components/ShoppingModal';
import { instacartService } from '../services/instacart';

const GroceryListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filterChecked, setFilterChecked] = useState<'all' | 'unchecked' | 'checked'>('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  useEffect(() => {
    if (user) {
      loadGroceryList();
    }
  }, [user]);

  useEffect(() => {
    // Load checked items from localStorage
    const saved = localStorage.getItem(`groceryChecked_${user?.uid}`);
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
  }, [user]);

  const loadGroceryList = async () => {
    try {
      setLoading(true);
      const mealPlan = await mealPlanService.getCurrentWeekPlan(user!.uid);
      
      if (mealPlan?.groceryListId) {
        // Fetch the actual grocery list
        const groceryListData = await groceryService.getGroceryList(mealPlan.groceryListId);
        setGroceryList(groceryListData);
        setGroceryItems(groceryListData.items);
      } else if (mealPlan?.groceryList) {
        // Fallback to legacy groceryList array in meal plan
        setGroceryItems(mealPlan.groceryList);
      } else if (mealPlan) {
        // Generate grocery list from meal plan
        await generateGroceryListFromMealPlan(mealPlan);
      }
    } catch (error) {
      console.error('Error loading grocery list:', error);
      // Don't show error toast here as it's handled in the UI
    } finally {
      setLoading(false);
    }
  };

  const generateGroceryListFromMealPlan = async (mealPlan: any) => {
    try {
      setIsGenerating(true);
      
      // Create a simplified grocery list from meal plan
      const items: GroceryItem[] = [];
      
      // Check if meals exist and have valid structure
      if (mealPlan.meals && Array.isArray(mealPlan.meals)) {
        mealPlan.meals.forEach((meal: any) => {
          // If meal has ingredients, process them
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ingredient: any) => {
              // Check if item already exists
              const existingItem = items.find(item => 
                item.name.toLowerCase() === ingredient.name?.toLowerCase()
              );
              
              if (!existingItem && ingredient.name) {
                items.push({
                  name: ingredient.name,
                  quantity: `${ingredient.amount || 1} ${ingredient.unit || 'item'}`,
                  category: ingredient.category || 'Other',
                  estimatedPrice: ingredient.estimatedPrice || 2.99,
                  isInPantry: false
                });
              }
            });
          }
        });
      }
      
      // If no items were generated from ingredients, create basic items from meal names
      if (items.length === 0 && mealPlan.meals) {
        // Generate basic grocery items based on meal names
        const basicItems = generateBasicGroceryItems(mealPlan.meals);
        items.push(...basicItems);
      }
      
      setGroceryItems(items);
      
      // Create grocery list object
      const generatedList: GroceryList = {
        id: `grocery_${Date.now()}`,
        mealPlanId: mealPlan.id,
        items: items,
        totalCost: items.reduce((sum, item) => sum + item.estimatedPrice, 0),
        budgetComparison: 0
      };
      
      setGroceryList(generatedList);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error('Unable to generate grocery list. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBasicGroceryItems = (meals: any[]): GroceryItem[] => {
    // Generate basic grocery items based on common meal components
    const items: GroceryItem[] = [
      { name: 'Mixed Vegetables', quantity: '2 lbs', category: 'Produce', estimatedPrice: 5.99, isInPantry: false },
      { name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat & Seafood', estimatedPrice: 12.99, isInPantry: false },
      { name: 'Ground Beef', quantity: '1 lb', category: 'Meat & Seafood', estimatedPrice: 5.99, isInPantry: false },
      { name: 'Pasta', quantity: '1 box', category: 'Pantry', estimatedPrice: 2.49, isInPantry: false },
      { name: 'Rice', quantity: '1 bag', category: 'Pantry', estimatedPrice: 3.99, isInPantry: false },
      { name: 'Bread', quantity: '1 loaf', category: 'Bakery', estimatedPrice: 2.99, isInPantry: false },
      { name: 'Milk', quantity: '1 gallon', category: 'Dairy & Eggs', estimatedPrice: 4.29, isInPantry: false },
      { name: 'Eggs', quantity: '1 dozen', category: 'Dairy & Eggs', estimatedPrice: 3.49, isInPantry: false },
      { name: 'Cheese', quantity: '8 oz', category: 'Dairy & Eggs', estimatedPrice: 4.99, isInPantry: false },
      { name: 'Onions', quantity: '3', category: 'Produce', estimatedPrice: 2.99, isInPantry: false },
      { name: 'Garlic', quantity: '1 bulb', category: 'Produce', estimatedPrice: 0.99, isInPantry: false },
      { name: 'Olive Oil', quantity: '1 bottle', category: 'Pantry', estimatedPrice: 7.99, isInPantry: false },
    ];
    
    return items;
  };

  const toggleItem = (itemName: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
    // Save to localStorage
    localStorage.setItem(`groceryChecked_${user?.uid}`, JSON.stringify(Array.from(newChecked)));
  };

  const addCustomItem = () => {
    if (newItemName.trim()) {
      const newItem: GroceryItem = {
        name: newItemName,
        quantity: '1',
        category: newItemCategory,
        estimatedPrice: 0,
        isInPantry: false
      };
      setGroceryItems([...groceryItems, newItem]);
      setNewItemName('');
      setShowAddItem(false);
      toast.success('Item added to list!');
    }
  };

  const clearChecked = () => {
    setCheckedItems(new Set());
    localStorage.removeItem(`groceryChecked_${user?.uid}`);
    toast.success('Cleared all checked items');
  };

  const printList = () => {
    window.print();
  };

  const getFilteredItems = () => {
    if (filterChecked === 'checked') {
      return groceryItems.filter(item => checkedItems.has(item.name));
    } else if (filterChecked === 'unchecked') {
      return groceryItems.filter(item => !checkedItems.has(item.name));
    }
    return groceryItems;
  };

  const getItemsByCategory = () => {
    const filtered = getFilteredItems();
    const grouped: { [key: string]: GroceryItem[] } = {};
    
    filtered.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  };

  const getTotalCost = () => {
    const filtered = getFilteredItems();
    return filtered.reduce((sum, item) => {
      if (!checkedItems.has(item.name)) {
        return sum + item.estimatedPrice;
      }
      return sum;
    }, 0);
  };

  const getProgress = () => {
    if (groceryItems.length === 0) return 0;
    return Math.round((checkedItems.size / groceryItems.length) * 100);
  };

  const handleClearChecked = () => {
    clearChecked();
  };

  const handlePrint = () => {
    printList();
  };

  // Hidden for now - Pantry functionality
  /*
  const handleAddToPantry = async () => {
    const checkedItemsList = Array.from(checkedItems);
    if (checkedItemsList.length === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const itemsToAdd = checkedItemsList.map(itemName => {
        const item = groceryItems.find(g => g.name === itemName);
        return {
          name: itemName,
          quantity: item?.quantity || '1',
          category: item?.category || 'Other',
          purchaseDate: new Date(),
          expirationDate: getDefaultExpirationDate(item?.category || 'Other')
        };
      });

      for (const item of itemsToAdd) {
        // await pantryService.addPantryItem(user!.uid, item); // Hidden for now
      }

      toast.success(`Added ${itemsToAdd.length} items to pantry`);
      clearChecked();
    } catch (error) {
      console.error('Error adding items to pantry:', error);
      toast.error('Failed to add items to pantry');
    }
  };

  const getDefaultExpirationDate = (category: string): Date => {
    const today = new Date();
    const daysToAdd = {
      'Produce': 7,
      'Dairy & Eggs': 14,
      'Meat & Seafood': 3,
      'Bakery': 7,
      'Pantry': 365,
      'Frozen': 180,
      'Beverages': 365,
      'Snacks': 90,
      'Other': 30
    }[category] || 30;
    
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + daysToAdd);
    return expirationDate;
  };
  */

  const handleExport = () => {
    // Placeholder for export functionality
    toast('Export functionality not yet implemented.', { icon: '📱' });
  };

  const handleShare = async () => {
    const shareText = generateShareableText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Grocery List',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('Grocery list copied to clipboard!');
      });
    }
  };

  const handleOrderOnInstacart = async () => {
    try {
      toast.loading('Creating your Instacart shopping list...', { id: 'instacart' });
      
      const instacartUrl = await instacartService.createShoppingListFromGroceryList(
        groceryList || {
          id: 'temp',
          mealPlanId: '',
          items: groceryItems,
          totalCost: getTotalCost(),
          budgetComparison: getTotalCost() - weeklyBudget,
          suggestedSwaps: []
        }
      );
      
      toast.success('Shopping list created! Redirecting to Instacart...', { id: 'instacart' });
      
      // Open Instacart in a new tab
      window.open(instacartUrl, '_blank');
    } catch (error) {
      console.error('Error creating Instacart list:', error);
      toast.error('Failed to create Instacart shopping list', { id: 'instacart' });
    }
  };

  const generateShareableText = () => {
    let text = `🛒 Grocery List (${new Date().toLocaleDateString()})\n\n`;
    
    const groupedItems = groceryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        const checked = checkedItems.has(item.name) ? '✓' : '○';
        text += `${checked} ${item.quantity} ${item.name}\n`;
      });
      text += '\n';
    });
    
    text += `Total: $${getTotalCost().toFixed(2)}`;
    return text;
  };

  const handleToggleItem = (itemName: string) => {
    toggleItem(itemName);
  };

  const handleQuantityChange = (itemName: string, change: number) => {
    setGroceryItems(prevItems => 
      prevItems.map(item => {
        if (item.name === itemName) {
          // Parse current quantity
          const currentQuantity = parseFloat(item.quantity) || 1;
          const newQuantity = Math.max(0.5, currentQuantity + (change * 0.5));
          
          // Format quantity nicely
          const formattedQuantity = newQuantity % 1 === 0 
            ? newQuantity.toString() 
            : newQuantity.toFixed(1);
          
          return {
            ...item,
            quantity: formattedQuantity,
            estimatedPrice: (item.estimatedPrice / currentQuantity) * newQuantity
          };
        }
        return item;
      })
    );
  };

  const getCategoryTotal = (items: GroceryItem[]) => {
    return items.reduce((sum, item) => sum + item.estimatedPrice, 0);
  };

  const budgetStatus = (totalCost: number, weeklyBudget: number) => {
    if (totalCost > weeklyBudget) {
      return 'over';
    } else if (totalCost < weeklyBudget) {
      return 'under';
    } else {
      return 'at';
    }
  };

  const totalCost = groceryList?.totalCost || getTotalCost();
  const weeklyBudget = 150; // Placeholder - should come from user profile
  const budgetComparison = groceryList?.budgetComparison || (totalCost - weeklyBudget);
  const hasSuggestedSwaps = groceryList?.suggestedSwaps && groceryList.suggestedSwaps.length > 0;

  const categoryGradients: Record<string, string> = {
    'Produce': 'from-green-500 to-green-600',
    'Dairy & Eggs': 'from-blue-500 to-blue-600',
    'Meat & Seafood': 'from-red-500 to-red-600',
    'Bakery': 'from-amber-500 to-amber-600',
    'Pantry': 'from-purple-500 to-purple-600',
    'Frozen': 'from-cyan-500 to-cyan-600',
    'Beverages': 'from-indigo-500 to-indigo-600',
    'Snacks': 'from-pink-500 to-pink-600',
    'Other': 'from-gray-500 to-gray-600'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your grocery list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Grocery List
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {checkedItems.size} of {groceryItems.length} items checked
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleClearChecked}
                disabled={checkedItems.size === 0}
                className="text-gray-700 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Checked
              </button>
              {/* Removed Add to Pantry button */}
              <div className="relative group">
                <button
                  disabled={groceryItems.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TruckIcon className="h-5 w-5 mr-2" />
                  Order Groceries
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-2xl bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => setShowShoppingModal(true)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 flex items-center transition-colors duration-200"
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-3 text-purple-600" />
                      <div>
                        <div className="font-medium">Shop with Partners</div>
                        <div className="text-xs text-gray-500">Compare prices & schedule delivery</div>
                      </div>
                    </button>
                    <button
                      onClick={handleOrderOnInstacart}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 flex items-center transition-colors duration-200"
                    >
                      <img 
                        src="https://www.instacart.com/assets/beetstrap/brand/2022/instacart-logo-color@3x-6b71df83cfba8c6827f59bff009df3be6e96d484ebdc5da7e6122e9555eae9b6.png" 
                        alt="Instacart" 
                        className="h-5 w-5 mr-3 object-contain"
                      />
                      <div>
                        <div className="font-medium">Order on Instacart</div>
                        <div className="text-xs text-gray-500">Quick checkout on Instacart.com</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>
              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isGenerating && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fadeInUp">
              <div className="flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-green-600 animate-pulse mr-3" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Generating grocery list from your meal plan...</p>
                  <p className="text-sm text-gray-600">This may take a moment</p>
                </div>
              </div>
            </div>
          )}

          {!loading && groceryItems.length === 0 && !isGenerating && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center animate-fadeInUp">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCartIcon className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Grocery List Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate a meal plan first to create your grocery list.
              </p>
              <button
                onClick={() => navigate('/meal-plan')}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg text-base font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Meal Plan
              </button>
            </div>
          )}

          {!loading && groceryItems.length > 0 && (
            <div className="space-y-6">
              {/* Budget Overview - Compact */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-fadeInUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div>
                      <div className="text-xl font-semibold text-gray-700">${weeklyBudget.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Budget</div>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div>
                      <div className="text-xl font-semibold text-green-600">${Math.max(0, weeklyBudget - totalCost).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Remaining</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-gray-900">{checkedItems.size}/{groceryItems.length}</div>
                    <div className="text-xs text-gray-500">Checked</div>
                  </div>
                </div>
                
                {/* Subtle Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Cost-Saving Suggestions - Even More Compact */}
              {hasSuggestedSwaps && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 animate-fadeInUp">
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-amber-900">Save ${Math.abs(budgetComparison).toFixed(2)}:</span>
                      <span className="text-amber-700 ml-2">
                        {groceryList.suggestedSwaps!.map((swap, index) => (
                          <span key={index}>
                            {index > 0 && ', '}
                            {swap.originalItem} → {swap.suggestedItem}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fadeInUp">
                {/* Select All - Now inside the list */}
                {groceryItems.length > 0 && (
                  <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200">
                    <button
                      onClick={() => {
                        if (checkedItems.size === groceryItems.length) {
                          // Unselect all
                          setCheckedItems(new Set());
                          localStorage.removeItem(`groceryChecked_${user?.uid}`);
                        } else {
                          // Select all
                          const allItems = new Set(groceryItems.map(item => item.name));
                          setCheckedItems(allItems);
                          localStorage.setItem(`groceryChecked_${user?.uid}`, JSON.stringify(Array.from(allItems)));
                        }
                      }}
                      className={`w-4 h-4 rounded border transition-all duration-200 ${
                        checkedItems.size === groceryItems.length 
                          ? 'bg-green-500 border-green-500' 
                          : checkedItems.size > 0 
                          ? 'bg-green-100 border-green-500'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {checkedItems.size === groceryItems.length && (
                        <svg className="w-2.5 h-2.5 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {checkedItems.size > 0 && checkedItems.size < groceryItems.length && (
                        <div className="w-2 h-2 bg-green-500 rounded-sm m-0.25"></div>
                      )}
                    </button>
                    <span className="text-sm font-medium text-gray-700">Select all items</span>
                  </div>
                )}

                {Object.entries(getItemsByCategory()).map(([category, items], categoryIndex) => (
                  <div key={category} className={categoryIndex > 0 ? 'mt-6' : ''}>
                    {/* Category Header - Ultra Minimal */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</h3>
                      <span className="text-xs text-gray-500">${getCategoryTotal(items).toFixed(2)}</span>
                    </div>

                    {/* Items List - Clean */}
                    <div className="space-y-1">
                      {items.map((item, itemIndex) => (
                        <div
                          key={item.name}
                          className={`flex items-center justify-between py-2 ${
                            itemIndex < items.length - 1 ? 'border-b border-gray-100' : ''
                          } ${checkedItems.has(item.name) ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {/* Minimal Checkbox */}
                            <button
                              onClick={() => handleToggleItem(item.name)}
                              className={`w-4 h-4 rounded border transition-all duration-200 ${
                                checkedItems.has(item.name) 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {checkedItems.has(item.name) && (
                                <svg className="w-2.5 h-2.5 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>

                            {/* Item Name */}
                            <span className={`text-sm text-gray-900 flex-1 ${
                              checkedItems.has(item.name) ? 'line-through' : ''
                            }`}>
                              {item.name}
                            </span>

                            {/* Quantity - Simple Text */}
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.name, -1);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <span className="min-w-[2.5rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.name, 1);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <span className="text-sm font-medium text-gray-900 ml-4">
                            ${item.estimatedPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Tips - Even More Minimal */}
              <div className="text-center text-xs text-gray-400 py-4 animate-fadeInUp">
                Pro tip: Buy generic brands and check weekly deals to save 20-30% on your grocery bill
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-2 animate-fadeInUp">
                <button
                  onClick={() => navigate('/meal-plan')}
                  className="bg-white text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Back to Meal Plan
                </button>
                <button
                  onClick={handleExport}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Export to Phone
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Shopping Modal */}
      {(groceryList || groceryItems.length > 0) && (
        <ShoppingModal
          isOpen={showShoppingModal}
          onClose={() => setShowShoppingModal(false)}
          groceryList={groceryList || {
            id: 'temp',
            mealPlanId: '',
            items: groceryItems,
            totalCost: getTotalCost(),
            budgetComparison: getTotalCost() - 150,
            suggestedSwaps: []
          }}
        />
      )}
    </div>
  );
};

export default GroceryListPage; 