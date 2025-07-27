import React, { useState, useEffect } from 'react';
import { XMarkIcon, TruckIcon, CreditCardIcon, CheckCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { GroceryList } from '../types';
import { shoppingService, Store, ShoppingCart, DeliverySlot, CartItem } from '../services/shopping';
import { userPreferencesService, SavedAddress, SavedPaymentMethod } from '../services/userPreferences';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryList: GroceryList;
}

type Step = 'store' | 'products' | 'delivery' | 'confirm' | 'success';

const ShoppingModal: React.FC<ShoppingModalProps> = ({ isOpen, onClose, groceryList }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('store');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [priceComparison, setPriceComparison] = useState<Array<{ store: Store; cart: ShoppingCart }>>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [savedPayments, setSavedPayments] = useState<SavedPaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<SavedPaymentMethod | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [tipAmount, setTipAmount] = useState(15); // percentage

  useEffect(() => {
    if (isOpen && user) {
      loadStores();
      loadUserPreferences();
    }
  }, [isOpen, user]);

  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const [addresses, payments, deliveryPrefs, shoppingPrefs] = await Promise.all([
        userPreferencesService.getSavedAddresses(user.uid),
        userPreferencesService.getSavedPaymentMethods(user.uid),
        userPreferencesService.getDeliveryPreferences(user.uid),
        userPreferencesService.getShoppingPreferences(user.uid)
      ]);
      
      // For demo purposes, if no saved data, use mock data
      const finalAddresses = addresses.length > 0 ? addresses : [
        {
          id: 'demo-1',
          label: 'Home',
          street: '123 Main Street',
          apartment: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          isDefault: true
        }
      ];
      
      const finalPayments = payments.length > 0 ? payments : [
        {
          id: 'demo-1',
          type: 'card' as const,
          label: 'Personal Visa',
          last4: '4242',
          cardBrand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];
      
      setSavedAddresses(finalAddresses);
      setSavedPayments(finalPayments);
      
      // Set defaults
      const defaultAddress = finalAddresses.find(a => a.isDefault);
      if (defaultAddress) setSelectedAddress(defaultAddress);
      
      const defaultPayment = finalPayments.find(p => p.isDefault);
      if (defaultPayment) setSelectedPayment(defaultPayment);
      
      if (shoppingPrefs?.defaultTip) {
        setTipAmount(shoppingPrefs.defaultTip);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadStores = async () => {
    setLoading(true);
    try {
      const [availableStores, comparisons] = await Promise.all([
        shoppingService.getAvailableStores(),
        shoppingService.comparePrices(groceryList)
      ]);
      setStores(availableStores);
      setPriceComparison(comparisons);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (store: Store) => {
    setSelectedStore(store);
    setLoading(true);
    
    try {
      const [storeCart, slots] = await Promise.all([
        shoppingService.searchProducts(store.id, groceryList),
        shoppingService.getDeliverySlots(store.id)
      ]);
      
      setCart(storeCart);
      setDeliverySlots(slots);
      setCurrentStep('products');
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    if (!cart) return;
    
    setCart({
      ...cart,
      items: cart.items.map(item => 
        item.groceryItemId === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const removeCartItem = (itemId: string) => {
    if (!cart) return;
    
    const newItems = cart.items.filter(item => item.groceryItemId !== itemId);
    const subtotal = newItems.reduce((sum, item) => sum + item.price, 0);
    const serviceFee = subtotal * 0.05;
    const tax = subtotal * 0.08;
    
    setCart({
      ...cart,
      items: newItems,
      subtotal,
      serviceFee,
      tax,
      total: subtotal + cart.deliveryFee + serviceFee + tax
    });
  };

  const proceedToDelivery = () => {
    if (!cart) return;
    
    const outOfStockItems = cart.items.filter(item => !item.inStock);
    if (outOfStockItems.length > 0 && !window.confirm(
      `${outOfStockItems.length} items are out of stock. Continue anyway?`
    )) {
      return;
    }
    
    setCurrentStep('delivery');
  };

  const selectDeliverySlot = (slot: DeliverySlot) => {
    setSelectedSlot(slot);
    setCurrentStep('confirm');
  };

  const placeOrder = async () => {
    if (!cart || !selectedSlot || !selectedAddress || !selectedPayment) {
      toast.error('Please complete all required information');
      return;
    }
    
    setLoading(true);
    try {
      // Calculate final total with tip
      const tipTotal = cart.total * (tipAmount / 100);
      const finalTotal = cart.total + tipTotal;
      
      const result = await shoppingService.placeOrder(
        cart,
        selectedSlot,
        selectedPayment.id,
        `${selectedAddress.street}${selectedAddress.apartment ? `, ${selectedAddress.apartment}` : ''}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}`
      );
      
      setOrderResult({
        ...result,
        total: finalTotal
      });
      setCurrentStep('success');
      toast.success('Order placed successfully!');
      
      // Save preferences for next time
      if (user) {
        await userPreferencesService.updateShoppingPreferences(user.uid, {
          defaultTip: tipAmount // This is the state variable, not the calculated amount
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  
  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['store', 'products', 'delivery', 'confirm'];
    return steps.indexOf(step) + 1;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentStep !== 'store' && currentStep !== 'success' && (
                  <button
                    onClick={() => {
                      if (currentStep === 'products') setCurrentStep('store');
                      else if (currentStep === 'delivery') setCurrentStep('products');
                      else if (currentStep === 'confirm') setCurrentStep('delivery');
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentStep === 'success' ? 'Order Complete! 🎉' : 'Order Groceries'}
                  </h2>
                  {currentStep === 'store' && (
                    <p className="text-xs text-gray-500">2 min checkout • Free returns</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            {currentStep !== 'success' && (
              <div className="bg-gray-50 -mx-6 px-6 py-3">
                <div className="flex items-center justify-between">
                  {[
                    { key: 'store', label: 'Store', icon: '🏪' },
                    { key: 'products', label: 'Review', icon: '🛒' },
                    { key: 'delivery', label: 'Delivery', icon: '📅' },
                    { key: 'confirm', label: 'Payment', icon: '💳' }
                  ].map((step, index) => (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center ${
                        index < 3 ? 'flex-1' : ''
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                            getStepNumber(currentStep) > index + 1
                              ? 'bg-green-100 text-green-600'
                              : getStepNumber(currentStep) === index + 1
                              ? 'bg-blue-600 text-white scale-110 shadow-lg'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {getStepNumber(currentStep) > index + 1 ? '✓' : step.icon}
                        </div>
                        {index < 3 && (
                          <div
                            className={`flex-1 h-1 mx-2 transition-all ${
                              getStepNumber(currentStep) > index + 1
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${
                        getStepNumber(currentStep) === index + 1
                          ? 'text-blue-600'
                          : getStepNumber(currentStep) > index + 1
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Store Selection */}
                {currentStep === 'store' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Choose a Store
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Prices include all fees and taxes • Delivery available today
                      </p>
                      
                      {/* Best Value Badge */}
                      <div className="grid gap-4">
                        {priceComparison.map(({ store, cart }, index) => (
                          <button
                            key={store.id}
                            onClick={() => selectStore(store)}
                            className={`bg-white border-2 rounded-lg p-4 transition-all text-left relative ${
                              index === 0 
                                ? 'border-green-500 hover:border-green-600 ring-2 ring-green-200' 
                                : 'border-gray-200 hover:border-blue-500'
                            }`}
                          >
                            {index === 0 && (
                              <div className="absolute -top-3 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Best Value
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <img 
                                  src={store.logo} 
                                  alt={store.name}
                                  className="h-12 w-auto object-contain"
                                />
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {store.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center">
                                      <StarIcon className="h-4 w-4 text-yellow-400" />
                                      <span className="text-sm text-gray-600 ml-1">
                                        {store.rating}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-gray-600">
                                      {store.estimatedDeliveryTime}
                                    </span>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-gray-600">
                                      {'$'.repeat(store.priceLevel)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">
                                  {formatCurrency(cart.total)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Delivery: {store.deliveryFee === 0 && store.type === 'amazon' 
                                    ? 'Free with Prime' 
                                    : formatCurrency(store.deliveryFee)}
                                </p>
                                {cart.estimatedSavings > 0 && (
                                  <p className="text-sm text-green-600">
                                    Save {formatCurrency(cart.estimatedSavings)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Review */}
                {currentStep === 'products' && cart && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Review Your Items
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {cart.items.filter(item => item.inStock).length} of {cart.items.length} items available
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentStep('store')}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Change Store
                        </button>
                      </div>
                      <div className="space-y-3">
                        {cart.items.map(item => (
                          <div
                            key={item.groceryItemId}
                            className={`bg-white border rounded-lg p-4 ${
                              !item.inStock ? 'border-red-200 bg-red-50' : 'border-gray-200'
                            }`}
                          >
                                                          <div className="flex items-start gap-4">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="h-16 w-16 object-cover rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900">
                                    {item.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {item.brand} • {item.quantity}
                                  </p>
                                  {!item.inStock && (
                                    <p className="text-sm text-red-600 font-medium mt-1">
                                      Out of stock - We'll find a substitute
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="text-right">
                                    {item.originalPrice && (
                                      <p className="text-sm text-gray-500 line-through">
                                        {formatCurrency(item.originalPrice)}
                                      </p>
                                    )}
                                    <p className="font-semibold text-gray-900">
                                      {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeCartItem(item.groceryItemId)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    title="Remove item"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Cart Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service Fee</span>
                        <span>{formatCurrency(cart.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(cart.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Est. Tax</span>
                        <span>{formatCurrency(cart.tax)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(cart.total)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={proceedToDelivery}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue to Delivery
                    </button>
                  </div>
                )}

                {/* Delivery Selection */}
                {currentStep === 'delivery' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Choose Delivery Time
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a 2-hour delivery window
                      </p>
                      
                      <div className="grid gap-3">
                        {deliverySlots
                          .filter(slot => slot.available)
                          .slice(0, 6)
                          .map((slot, index) => (
                            <button
                              key={slot.id}
                              onClick={() => selectDeliverySlot(slot)}
                              className={`bg-white border-2 rounded-lg p-4 transition-all text-left ${
                                index === 0 
                                  ? 'border-blue-500 hover:border-blue-600 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-blue-500'
                              }`}
                            >
                              {index === 0 && (
                                <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-2">
                                  FASTEST
                                </span>
                              )}
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {new Date(slot.date).toDateString() === new Date().toDateString() ? 'Today' : 
                                     new Date(slot.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })} • {slot.startTime} - {slot.endTime}
                                  </p>
                                  {slot.price > 5 && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Peak hours pricing
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg text-gray-900">
                                    {formatCurrency(slot.price)}
                                  </p>
                                  <p className="text-xs text-gray-500">delivery</p>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Confirmation */}
                {currentStep === 'confirm' && cart && selectedSlot && selectedStore && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Confirm Your Order
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Delivery Details</h4>
                            <button
                              onClick={() => setCurrentStep('delivery')}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Change
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TruckIcon className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-gray-700">
                                {new Date(selectedSlot.date).toDateString() === new Date().toDateString() ? 'Today' : 
                                 new Date(selectedSlot.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}, {selectedSlot.startTime} - {selectedSlot.endTime}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <HomeIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                {selectedAddress ? (
                                  <>
                                    <p className="text-sm text-gray-700">{selectedAddress.label}</p>
                                    <p className="text-sm text-gray-600">
                                      {selectedAddress.street}
                                      {selectedAddress.apartment && `, ${selectedAddress.apartment}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                                    </p>
                                  </>
                                ) : (
                                  <button className="text-sm text-blue-600 hover:text-blue-700">
                                    Add delivery address
                                  </button>
                                )}
                              </div>
                            </div>
                            {deliveryInstructions && (
                              <p className="text-sm text-gray-600 italic mt-2">
                                "{deliveryInstructions}"
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{cart.items.length} items</span>
                              <span className="text-gray-700">{formatCurrency(cart.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery</span>
                              <span className="text-gray-700">{formatCurrency(cart.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service & Tax</span>
                              <span className="text-gray-700">{formatCurrency(cart.serviceFee + cart.tax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tip ({tipAmount}%)</span>
                              <span className="text-gray-700">{formatCurrency(cart.total * (tipAmount / 100))}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">
                                  {formatCurrency(cart.total + (cart.total * (tipAmount / 100)))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Payment & Tip</h4>
                          <div className="space-y-3">
                            {selectedPayment ? (
                              <div className="flex items-center gap-3">
                                <CreditCardIcon className="h-5 w-5 text-gray-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">{selectedPayment.label}</p>
                                  <p className="text-sm text-gray-600">
                                    •••• {selectedPayment.last4}
                                  </p>
                                </div>
                                <button className="text-sm text-blue-600 hover:text-blue-700">
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button className="text-sm text-blue-600 hover:text-blue-700">
                                Add payment method
                              </button>
                            )}
                            
                            {/* Tip Selection */}
                            <div className="border-t pt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Driver Tip
                              </p>
                              <div className="grid grid-cols-4 gap-2">
                                {[10, 15, 20, 25].map(percent => (
                                  <button
                                    key={percent}
                                    onClick={() => setTipAmount(percent)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                      tipAmount === percent
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {percent}%
                                  </button>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Tip amount: {formatCurrency(cart.total * (tipAmount / 100))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={placeOrder}
                        className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Success */}
                {currentStep === 'success' && orderResult && (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Order Placed Successfully!
                      </h3>
                      <p className="text-gray-600">
                        Your groceries are on their way
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Order number</p>
                          <p className="font-mono text-sm font-medium">{orderResult.orderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total paid</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(orderResult.total)}</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-3">
                          <TruckIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Delivery expected by
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(orderResult.estimatedDelivery).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {orderResult.trackingUrl && (
                        <a
                          href={orderResult.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          Track Your Order
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={onClose}
                        className="w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Done Shopping
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingModal; 