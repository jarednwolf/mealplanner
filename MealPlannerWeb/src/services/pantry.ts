import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PantryItem } from '../types';

class PantryService {
  private readonly collectionName = 'pantry';

  /**
   * Get all pantry items for a user
   */
  async getUserPantryItems(userId: string): Promise<PantryItem[]> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        orderBy('category', 'asc'),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: PantryItem[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          expirationDate: data.expirationDate?.toDate(),
        } as PantryItem);
      });
      
      return items;
    } catch (error) {
      console.error('Error getting pantry items:', error);
      throw new Error('Failed to load pantry items');
    }
  }

  /**
   * Add a new pantry item
   */
  async addPantryItem(userId: string, item: Omit<PantryItem, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(firestore, this.collectionName));
      const pantryItem = {
        ...item,
        userId,
        purchaseDate: Timestamp.fromDate(item.purchaseDate),
        expirationDate: item.expirationDate ? Timestamp.fromDate(item.expirationDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(docRef, pantryItem);
      return docRef.id;
    } catch (error) {
      console.error('Error adding pantry item:', error);
      throw new Error('Failed to add pantry item');
    }
  }

  /**
   * Update a pantry item
   */
  async updatePantryItem(itemId: string, updates: Partial<PantryItem>): Promise<void> {
    try {
      const docRef = doc(firestore, this.collectionName, itemId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      if (updates.purchaseDate) {
        updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
      }
      
      if (updates.expirationDate) {
        updateData.expirationDate = Timestamp.fromDate(updates.expirationDate);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating pantry item:', error);
      throw new Error('Failed to update pantry item');
    }
  }

  /**
   * Delete a pantry item
   */
  async deletePantryItem(itemId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.collectionName, itemId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      throw new Error('Failed to delete pantry item');
    }
  }

  /**
   * Get items expiring soon (within 7 days)
   */
  async getExpiringItems(userId: string, daysAhead: number = 7): Promise<PantryItem[]> {
    try {
      const items = await this.getUserPantryItems(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
      
      return items.filter(item => {
        if (!item.expirationDate) return false;
        return item.expirationDate <= cutoffDate && item.expirationDate >= new Date();
      }).sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0;
        return a.expirationDate.getTime() - b.expirationDate.getTime();
      });
    } catch (error) {
      console.error('Error getting expiring items:', error);
      throw new Error('Failed to get expiring items');
    }
  }

  /**
   * Check if an item exists in pantry (for grocery list filtering)
   */
  async checkItemInPantry(userId: string, itemName: string): Promise<PantryItem | null> {
    try {
      const items = await this.getUserPantryItems(userId);
      const normalizedName = itemName.toLowerCase().trim();
      
      return items.find(item => 
        item.name.toLowerCase().trim() === normalizedName
      ) || null;
    } catch (error) {
      console.error('Error checking pantry item:', error);
      return null;
    }
  }

  /**
   * Get pantry items by category
   */
  async getItemsByCategory(userId: string): Promise<Map<string, PantryItem[]>> {
    try {
      const items = await this.getUserPantryItems(userId);
      const categorized = new Map<string, PantryItem[]>();
      
      items.forEach(item => {
        const category = item.category || 'Other';
        if (!categorized.has(category)) {
          categorized.set(category, []);
        }
        categorized.get(category)!.push(item);
      });
      
      return categorized;
    } catch (error) {
      console.error('Error getting items by category:', error);
      throw new Error('Failed to get items by category');
    }
  }

  /**
   * Quick add common pantry items
   */
  async addCommonItems(userId: string, items: string[]): Promise<void> {
    try {
      const commonItemDefaults: Record<string, { category: string; shelfLife: number }> = {
        'salt': { category: 'Pantry', shelfLife: 365 * 2 }, // 2 years
        'pepper': { category: 'Pantry', shelfLife: 365 * 2 },
        'olive oil': { category: 'Pantry', shelfLife: 365 },
        'butter': { category: 'Dairy & Eggs', shelfLife: 30 },
        'milk': { category: 'Dairy & Eggs', shelfLife: 7 },
        'eggs': { category: 'Dairy & Eggs', shelfLife: 21 },
        'flour': { category: 'Pantry', shelfLife: 365 },
        'sugar': { category: 'Pantry', shelfLife: 365 * 2 },
        'rice': { category: 'Pantry', shelfLife: 365 },
        'pasta': { category: 'Pantry', shelfLife: 365 },
        'onions': { category: 'Produce', shelfLife: 30 },
        'garlic': { category: 'Produce', shelfLife: 30 },
      };
      
      const promises = items.map(itemName => {
        const defaults = commonItemDefaults[itemName.toLowerCase()] || {
          category: 'Other',
          shelfLife: 30
        };
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + defaults.shelfLife);
        
        return this.addPantryItem(userId, {
          name: itemName,
          quantity: '1',
          category: defaults.category,
          purchaseDate: new Date(),
          expirationDate
        });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error adding common items:', error);
      throw new Error('Failed to add common items');
    }
  }
}

export const pantryService = new PantryService();
export default pantryService; 