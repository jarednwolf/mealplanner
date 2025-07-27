import { GroceryList, GroceryItem } from '../types';
import { config } from '../config/env';

export interface DeliverySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  type: 'instacart' | 'walmart' | 'amazon' | 'local';
  estimatedDeliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  rating: number;
  priceLevel: 1 | 2 | 3; // 1 = budget, 2 = moderate, 3 = premium
}

export interface ShoppingCart {
  storeId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  estimatedSavings: number;
}

export interface CartItem {
  groceryItemId: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  quantity: string;
  image?: string;
  inStock: boolean;
  substitutable: boolean;
}

export interface OrderResult {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered';
  estimatedDelivery: Date;
  trackingUrl?: string;
  total: number;
}

class ShoppingService {
  private mockStores: Store[] = [
    {
      id: 'instacart_1',
      name: 'Whole Foods via Instacart',
      logo: 'https://www.instacart.com/assets/domains/warehouse/logo/5/65f2304b-908e-4cd0-981d-0d4e4effa8de.png',
      type: 'instacart',
      estimatedDeliveryTime: '2 hours',
      deliveryFee: 3.99,
      minimumOrder: 35,
      rating: 4.8,
      priceLevel: 3
    },
    {
      id: 'walmart_1',
      name: 'Walmart Grocery',
      logo: 'https://i5.walmartimages.com/dfw/63fd9f59-e0d6/65c3c1db-a8a6-4e4c-8365-c2a3c7350d13/v1/walmart-logo.svg',
      type: 'walmart',
      estimatedDeliveryTime: 'Same day',
      deliveryFee: 7.95,
      minimumOrder: 35,
      rating: 4.5,
      priceLevel: 1
    },
    {
      id: 'instacart_2',
      name: 'Kroger via Instacart',
      logo: 'https://www.instacart.com/assets/domains/warehouse/logo/270/b7fd3a50-65f4-4a5a-ad97-08128bab7f78.png',
      type: 'instacart',
      estimatedDeliveryTime: '2-3 hours',
      deliveryFee: 3.99,
      minimumOrder: 35,
      rating: 4.6,
      priceLevel: 2
    },
    {
      id: 'amazon_fresh',
      name: 'Amazon Fresh',
      logo: 'https://m.media-amazon.com/images/G/01/omaha/images/merch/2020/Grocery/AmazonFresh_logo._CB1584042821_.png',
      type: 'amazon',
      estimatedDeliveryTime: '2 hour windows',
      deliveryFee: 0, // Free with Prime
      minimumOrder: 35,
      rating: 4.7,
      priceLevel: 2
    }
  ];

  /**
   * Get available stores for user's location
   */
  async getAvailableStores(zipCode?: string): Promise<Store[]> {
    // In production, this would call real APIs to check availability
    // For now, return mock stores
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.mockStores);
      }, 500);
    });
  }

  /**
   * Get delivery slots for a store
   */
  async getDeliverySlots(storeId: string, days: number = 7): Promise<DeliverySlot[]> {
    const slots: DeliverySlot[] = [];
    const today = new Date();
    
    for (let d = 0; d < days; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      
      // Generate time slots (8 AM to 8 PM, 2-hour windows)
      for (let hour = 8; hour < 20; hour += 2) {
        const available = Math.random() > 0.3; // 70% availability
        const surgePrice = hour >= 17 ? 2 : 0; // Evening surge pricing
        
        slots.push({
          id: `slot_${d}_${hour}`,
          date,
          startTime: `${hour}:00`,
          endTime: `${hour + 2}:00`,
          available,
          price: 3.99 + surgePrice
        });
      }
    }
    
    return slots;
  }

  /**
   * Search for products and match with grocery list
   */
  async searchProducts(
    storeId: string,
    groceryList: GroceryList
  ): Promise<ShoppingCart> {
    const { pricingService } = await import('./pricing');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const store = this.mockStores.find(s => s.id === storeId);
    if (!store) throw new Error('Store not found');
    
    // Get user's zip code
    const userProfile = await this.getUserProfile();
    const zipCode = userProfile?.zipCode;
    
    // Convert grocery items to cart items with real pricing
    const cartItems: CartItem[] = await Promise.all(
      groceryList.items.map(async (item) => {
        // Parse quantity and unit from the quantity string
        const [amount, ...unitParts] = item.quantity.split(' ');
        const quantity = parseFloat(amount) || 1;
        const unit = unitParts.join(' ') || 'each';
        
        // Get real prices for this specific store
        const prices = await pricingService.getIngredientPrices(
          item.name,
          quantity,
          unit,
          zipCode
        );
        
        // Find price for this store or use average
        const storePrice = prices.find(p => p.storeName === store.name)?.price ||
          prices.reduce((sum, p) => sum + p.price, 0) / prices.length ||
          item.estimatedPrice;
        
        const hasDiscount = Math.random() > 0.7; // 30% chance of discount
        const discountedPrice = hasDiscount ? storePrice * 0.85 : storePrice;
        
        return {
          groceryItemId: item.name,
          productId: `prod_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          brand: this.generateBrand(item.category),
          price: discountedPrice,
          originalPrice: hasDiscount ? storePrice : undefined,
          quantity: item.quantity,
          image: this.generateProductImage(item.name),
          inStock: Math.random() > 0.1, // 90% in stock
          substitutable: true
        };
      })
    );
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const serviceFee = subtotal * 0.05; // 5% service fee
    const tax = subtotal * 0.08; // 8% tax
    const estimatedSavings = cartItems.reduce((sum, item) => {
      return sum + (item.originalPrice ? item.originalPrice - item.price : 0);
    }, 0);
    
    return {
      storeId,
      items: cartItems,
      subtotal,
      deliveryFee: store.deliveryFee,
      serviceFee,
      tax,
      total: subtotal + store.deliveryFee + serviceFee + tax,
      estimatedSavings
    };
  }

  /**
   * Place an order
   */
  async placeOrder(
    cart: ShoppingCart,
    deliverySlot: DeliverySlot,
    paymentMethodId: string,
    deliveryAddress: string
  ): Promise<OrderResult> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deliveryDate = new Date(deliverySlot.date);
    const [hours] = deliverySlot.startTime.split(':');
    deliveryDate.setHours(parseInt(hours) + 1); // Mid-window delivery
    
    return {
      orderId,
      status: 'confirmed',
      estimatedDelivery: deliveryDate,
      trackingUrl: `https://track.example.com/${orderId}`,
      total: cart.total
    };
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderResult> {
    // Simulate fetching order status
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock progression based on order age
    const orderTime = parseInt(orderId.split('_')[1]);
    const elapsed = Date.now() - orderTime;
    const hours = elapsed / (1000 * 60 * 60);
    
    let status: OrderResult['status'] = 'pending';
    if (hours > 4) status = 'delivered';
    else if (hours > 3) status = 'delivering';
    else if (hours > 1) status = 'preparing';
    else if (hours > 0.1) status = 'confirmed';
    
    return {
      orderId,
      status,
      estimatedDelivery: new Date(orderTime + 4 * 60 * 60 * 1000), // 4 hours from order
      trackingUrl: `https://track.example.com/${orderId}`,
      total: 0 // Would be stored in real implementation
    };
  }

  /**
   * Compare prices across stores
   */
  async comparePrices(groceryList: GroceryList): Promise<Array<{
    store: Store;
    cart: ShoppingCart;
  }>> {
    const stores = await this.getAvailableStores();
    
    const comparisons = await Promise.all(
      stores.map(async store => ({
        store,
        cart: await this.searchProducts(store.id, groceryList)
      }))
    );
    
    // Sort by total price
    return comparisons.sort((a, b) => a.cart.total - b.cart.total);
  }

  /**
   * Generate mock brand names
   */
  private generateBrand(category: string): string {
    const brands: Record<string, string[]> = {
      'Produce': ['Fresh Farms', 'Organic Valley', 'Local Harvest'],
      'Dairy & Eggs': ['Horizon', 'Organic Valley', 'Land O Lakes'],
      'Meat & Seafood': ['Tyson', 'Perdue', 'Wild Caught'],
      'Pantry': ['Barilla', 'Campbell\'s', 'General Mills'],
      'Frozen': ['Birds Eye', 'Healthy Choice', 'Amy\'s'],
      'Bakery': ['Wonder', 'Dave\'s Killer', 'Nature\'s Own'],
      'Beverages': ['Coca-Cola', 'Simply', 'Tropicana'],
      'Snacks': ['Lay\'s', 'Oreo', 'Nature Valley']
    };
    
    const categoryBrands = brands[category] || ['Generic'];
    return categoryBrands[Math.floor(Math.random() * categoryBrands.length)];
  }

  /**
   * Generate mock product images
   */
  private generateProductImage(productName: string): string {
    // Map common items to stock photos
    const imageMap: Record<string, string> = {
      'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200',
      'broccoli': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=200',
      'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
      'eggs': 'https://images.unsplash.com/photo-1491524062933-cb0289261700?w=200',
      'bread': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200',
      'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200',
      'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200'
    };
    
    const key = Object.keys(imageMap).find(k => 
      productName.toLowerCase().includes(k)
    );
    
    return key ? imageMap[key] : 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200';
  }

  /**
   * Get user profile for location-based pricing
   */
  private async getUserProfile() {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return null;
      
      // For now, return a mock profile with zip code
      // In production, this would fetch from Firestore
      return { zipCode: '90210' };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}

export const shoppingService = new ShoppingService();
export default shoppingService; 