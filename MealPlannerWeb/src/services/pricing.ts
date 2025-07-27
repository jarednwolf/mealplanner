import { Ingredient } from '../types';
import { config } from '../config/env';

export interface PriceData {
  productName: string;
  price: number;
  unit: string;
  store: string;
  lastUpdated: Date;
  isOnSale?: boolean;
  regularPrice?: number;
}

export interface StorePrice {
  storeId: string;
  storeName: string;
  price: number;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  unit: string;
}

export interface PricingProvider {
  name: string;
  search(query: string, zipCode?: string): Promise<PriceData[]>;
  getPriceByUPC(upc: string): Promise<PriceData | null>;
}

class PricingService {
  private cache: Map<string, { data: PriceData[]; timestamp: number }> = new Map();
  private cacheExpiry = 1000 * 60 * 60 * 24; // 24 hours
  private providers: PricingProvider[] = [];

  constructor() {
    // Initialize providers based on available API keys
    this.initializeProviders();
  }

  private initializeProviders() {
    // Add Kroger provider if API key is available
    if (import.meta.env.VITE_KROGER_CLIENT_ID && import.meta.env.VITE_KROGER_CLIENT_SECRET) {
      this.providers.push(new KrogerPricingProvider());
    }

    // Add Walmart provider if API key is available
    if (import.meta.env.VITE_WALMART_API_KEY) {
      this.providers.push(new WalmartPricingProvider());
    }

    // Always include Spoonacular as fallback since we already have it
    this.providers.push(new SpoonacularPricingProvider());

    // Add mock provider as last resort
    this.providers.push(new MockPricingProvider());
  }

  /**
   * Get prices for an ingredient from multiple stores
   */
  async getIngredientPrices(
    ingredient: string,
    quantity: number,
    unit: string,
    zipCode?: string
  ): Promise<StorePrice[]> {
    const cacheKey = `${ingredient}-${zipCode || 'default'}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.convertToPrices(cached, quantity, unit);
    }

    // Query all providers in parallel
    const allPrices: PriceData[] = [];
    
    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const prices = await provider.search(ingredient, zipCode);
          allPrices.push(...prices);
        } catch (error) {
          console.error(`Error fetching prices from ${provider.name}:`, error);
        }
      })
    );

    // Cache the results
    this.saveToCache(cacheKey, allPrices);

    // Convert to store prices
    return this.convertToPrices(allPrices, quantity, unit);
  }

  /**
   * Get the best price for an ingredient
   */
  async getBestPrice(
    ingredient: string,
    quantity: number,
    unit: string,
    zipCode?: string
  ): Promise<number> {
    const prices = await this.getIngredientPrices(ingredient, quantity, unit, zipCode);
    
    if (prices.length === 0) {
      // Fallback to estimated price
      return this.estimatePrice(ingredient, quantity, unit);
    }

    // Return the lowest price
    return Math.min(...prices.map(p => p.price));
  }

  /**
   * Get average price across all stores
   */
  async getAveragePrice(
    ingredient: string,
    quantity: number,
    unit: string,
    zipCode?: string
  ): Promise<number> {
    const prices = await this.getIngredientPrices(ingredient, quantity, unit, zipCode);
    
    if (prices.length === 0) {
      return this.estimatePrice(ingredient, quantity, unit);
    }

    const sum = prices.reduce((acc, p) => acc + p.price, 0);
    return sum / prices.length;
  }

  /**
   * Convert raw price data to store prices
   */
  private convertToPrices(
    priceData: PriceData[],
    quantity: number,
    unit: string
  ): StorePrice[] {
    return priceData.map(data => ({
      storeId: data.store.toLowerCase().replace(/\s+/g, '_'),
      storeName: data.store,
      price: this.adjustPriceForQuantity(data.price, data.unit, quantity, unit),
      availability: 'in-stock' as const, // Default to in-stock
      unit: unit
    }));
  }

  /**
   * Adjust price based on quantity and unit conversion
   */
  private adjustPriceForQuantity(
    basePrice: number,
    baseUnit: string,
    targetQuantity: number,
    targetUnit: string
  ): number {
    // Simple unit conversion logic
    // In production, this would be more comprehensive
    const conversionRates: Record<string, Record<string, number>> = {
      'lb': { 'oz': 16, 'kg': 0.453592 },
      'oz': { 'lb': 0.0625, 'g': 28.3495 },
      'cup': { 'tbsp': 16, 'tsp': 48, 'ml': 236.588 },
      'tbsp': { 'tsp': 3, 'cup': 0.0625, 'ml': 14.7868 }
    };

    let multiplier = targetQuantity;
    
    // Apply unit conversion if needed
    if (baseUnit !== targetUnit && conversionRates[baseUnit]?.[targetUnit]) {
      multiplier *= conversionRates[baseUnit][targetUnit];
    }

    return basePrice * multiplier;
  }

  /**
   * Estimate price when no data is available
   */
  private estimatePrice(ingredient: string, quantity: number, unit: string): number {
    // Basic price estimation based on ingredient category
    const categoryPrices: Record<string, number> = {
      'produce': 2.50,
      'meat': 8.00,
      'dairy': 3.50,
      'pantry': 2.00,
      'frozen': 4.00,
      'bakery': 3.00,
      'beverages': 2.50,
      'snacks': 3.50
    };

    // Determine category from ingredient name
    const category = this.categorizeIngredient(ingredient);
    const basePrice = categoryPrices[category] || 3.00;

    // Adjust for quantity
    return basePrice * quantity;
  }

  /**
   * Categorize ingredient based on name
   */
  private categorizeIngredient(ingredient: string): string {
    const lowerIngredient = ingredient.toLowerCase();
    
    if (/chicken|beef|pork|fish|salmon|turkey/.test(lowerIngredient)) return 'meat';
    if (/milk|cheese|yogurt|butter|egg/.test(lowerIngredient)) return 'dairy';
    if (/bread|bagel|muffin|roll/.test(lowerIngredient)) return 'bakery';
    if (/lettuce|tomato|carrot|broccoli|fruit|apple|banana/.test(lowerIngredient)) return 'produce';
    if (/frozen|ice cream/.test(lowerIngredient)) return 'frozen';
    if (/soda|juice|water|coffee|tea/.test(lowerIngredient)) return 'beverages';
    if (/chips|cookie|candy/.test(lowerIngredient)) return 'snacks';
    
    return 'pantry';
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): PriceData[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private saveToCache(key: string, data: PriceData[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

/**
 * Kroger API Provider
 */
class KrogerPricingProvider implements PricingProvider {
  name = 'Kroger';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async search(query: string, zipCode?: string): Promise<PriceData[]> {
    try {
      await this.ensureAuthenticated();
      
      const response = await fetch(
        `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(query)}&filter.locationId=${zipCode || '45202'}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Kroger API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data.map((product: any) => ({
        productName: product.description,
        price: product.items[0]?.price?.regular || 0,
        unit: product.items[0]?.size || 'each',
        store: 'Kroger',
        lastUpdated: new Date(),
        isOnSale: product.items[0]?.price?.promo !== undefined,
        regularPrice: product.items[0]?.price?.regular
      }));
    } catch (error) {
      console.error('Kroger API error:', error);
      return [];
    }
  }

  async getPriceByUPC(upc: string): Promise<PriceData | null> {
    // Implementation for UPC lookup
    return null;
  }

  private async ensureAuthenticated() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    // Get new access token
    const clientId = import.meta.env.VITE_KROGER_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_KROGER_CLIENT_SECRET;
    
    const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
  }
}

/**
 * Walmart API Provider
 */
class WalmartPricingProvider implements PricingProvider {
  name = 'Walmart';
  private apiKey = import.meta.env.VITE_WALMART_API_KEY;

  async search(query: string, zipCode?: string): Promise<PriceData[]> {
    try {
      const response = await fetch(
        `https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'WM_SEC.ACCESS_TOKEN': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.items.map((item: any) => ({
        productName: item.name,
        price: item.salePrice || item.msrp,
        unit: 'each', // Walmart doesn't always provide unit info
        store: 'Walmart',
        lastUpdated: new Date(),
        isOnSale: item.salePrice < item.msrp,
        regularPrice: item.msrp
      }));
    } catch (error) {
      console.error('Walmart API error:', error);
      return [];
    }
  }

  async getPriceByUPC(upc: string): Promise<PriceData | null> {
    // Implementation for UPC lookup
    return null;
  }
}

/**
 * Spoonacular Provider (using existing integration)
 */
class SpoonacularPricingProvider implements PricingProvider {
  name = 'Spoonacular';
  private functionsUrl = config.functionsUrl;

  async search(query: string, zipCode?: string): Promise<PriceData[]> {
    try {
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${this.functionsUrl}/spoonacularProxy?endpoint=food/ingredients/search&query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const { data } = await response.json();
      
      // Spoonacular provides estimated costs
      return data.results.map((ingredient: any) => ({
        productName: ingredient.name,
        price: ingredient.estimatedCost?.value || 2.50,
        unit: ingredient.estimatedCost?.unit || 'each',
        store: 'Average Market Price',
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Spoonacular API error:', error);
      return [];
    }
  }

  async getPriceByUPC(upc: string): Promise<PriceData | null> {
    return null;
  }
}

/**
 * Mock Provider (fallback)
 */
class MockPricingProvider implements PricingProvider {
  name = 'Mock';

  async search(query: string, zipCode?: string): Promise<PriceData[]> {
    // Generate realistic mock prices based on ingredient type
    const basePrices: Record<string, number> = {
      'chicken': 7.99,
      'beef': 12.99,
      'salmon': 14.99,
      'broccoli': 2.99,
      'rice': 3.99,
      'pasta': 2.49,
      'milk': 3.99,
      'eggs': 4.99,
      'bread': 2.99
    };

    const matchedKey = Object.keys(basePrices).find(key => 
      query.toLowerCase().includes(key)
    );

    const basePrice = basePrices[matchedKey || ''] || 3.99;
    
    // Generate prices for 3 mock stores with slight variations
    return [
      {
        productName: query,
        price: basePrice * 0.95,
        unit: 'each',
        store: 'Budget Mart',
        lastUpdated: new Date()
      },
      {
        productName: query,
        price: basePrice,
        unit: 'each',
        store: 'City Grocer',
        lastUpdated: new Date()
      },
      {
        productName: query,
        price: basePrice * 1.15,
        unit: 'each',
        store: 'Premium Foods',
        lastUpdated: new Date()
      }
    ];
  }

  async getPriceByUPC(upc: string): Promise<PriceData | null> {
    return null;
  }
}

export const pricingService = new PricingService(); 