import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Work", etc.
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  label: string; // "Personal Visa", etc.
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardBrand?: string;
  isDefault: boolean;
}

export interface DeliveryPreferences {
  leaveAtDoor: boolean;
  ringDoorbell: boolean;
  contactlessPreferred: boolean;
  specialInstructions?: string;
  preferredDeliveryTimes?: {
    weekday: string[];
    weekend: string[];
  };
}

export interface ShoppingPreferences {
  substitutionPreference: 'allow' | 'ask' | 'never';
  communicationPreference: 'text' | 'app' | 'none';
  defaultTip: number; // percentage
  bagPreference: 'paper' | 'plastic' | 'reusable';
}

class UserPreferencesService {
  // Addresses
  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    try {
      const addressesRef = collection(db, 'users', userId, 'addresses');
      const snapshot = await getDocs(addressesRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedAddress));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  }

  async saveAddress(userId: string, address: Omit<SavedAddress, 'id'>): Promise<string> {
    try {
      // If this is set as default, unset other defaults
      if (address.isDefault) {
        const addresses = await this.getSavedAddresses(userId);
        for (const addr of addresses) {
          if (addr.isDefault) {
            await updateDoc(doc(db, 'users', userId, 'addresses', addr.id), {
              isDefault: false
            });
          }
        }
      }

      const addressRef = doc(collection(db, 'users', userId, 'addresses'));
      await setDoc(addressRef, {
        ...address,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return addressRef.id;
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'addresses', addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  // Payment Methods
  async getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    try {
      const paymentsRef = collection(db, 'users', userId, 'paymentMethods');
      const snapshot = await getDocs(paymentsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedPaymentMethod));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async savePaymentMethod(userId: string, payment: Omit<SavedPaymentMethod, 'id'>): Promise<string> {
    try {
      // If this is set as default, unset other defaults
      if (payment.isDefault) {
        const payments = await this.getSavedPaymentMethods(userId);
        for (const pm of payments) {
          if (pm.isDefault) {
            await updateDoc(doc(db, 'users', userId, 'paymentMethods', pm.id), {
              isDefault: false
            });
          }
        }
      }

      const paymentRef = doc(collection(db, 'users', userId, 'paymentMethods'));
      await setDoc(paymentRef, {
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return paymentRef.id;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  async deletePaymentMethod(userId: string, paymentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'paymentMethods', paymentId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Delivery Preferences
  async getDeliveryPreferences(userId: string): Promise<DeliveryPreferences | null> {
    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'delivery');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as DeliveryPreferences;
      }
      
      // Return defaults
      return {
        leaveAtDoor: true,
        ringDoorbell: false,
        contactlessPreferred: true
      };
    } catch (error) {
      console.error('Error fetching delivery preferences:', error);
      return null;
    }
  }

  async updateDeliveryPreferences(userId: string, preferences: Partial<DeliveryPreferences>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'delivery');
      await setDoc(docRef, {
        ...preferences,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating delivery preferences:', error);
      throw error;
    }
  }

  // Shopping Preferences
  async getShoppingPreferences(userId: string): Promise<ShoppingPreferences | null> {
    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'shopping');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as ShoppingPreferences;
      }
      
      // Return defaults
      return {
        substitutionPreference: 'ask',
        communicationPreference: 'text',
        defaultTip: 15,
        bagPreference: 'reusable'
      };
    } catch (error) {
      console.error('Error fetching shopping preferences:', error);
      return null;
    }
  }

  async updateShoppingPreferences(userId: string, preferences: Partial<ShoppingPreferences>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'shopping');
      await setDoc(docRef, {
        ...preferences,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating shopping preferences:', error);
      throw error;
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService; 