import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  updateDoc,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  serverTimestamp,
  Query,
  CollectionReference
} from 'firebase/firestore';
import { Material, Product, ProductRecipe } from '../types';

// Collection names
export const COLLECTIONS = {
  RECIPES: 'recipes',
  PRODUCTS: 'products',
  MATERIALS: 'materials',
  DEPARTMENTS: 'departments',
  INVENTORY_ENTRIES: 'inventory_entries',
  INVENTORY_TRANSACTIONS: 'inventory_transactions',
  STORAGE_LOCATIONS: 'storage_locations',
  MATERIAL_STOCKS: 'material_stocks',
  SALES_DATA: 'sales_data',
  PRODUCTION_BATCHES: 'production_batches',
  USER_ACTIVITIES: 'user_activities'
} as const;

export const firebaseService = {
  // Subscribe to a collection
  subscribeToCollection: (collectionName: string, onUpdate: (data: any[]) => void) => {
    const collectionRef = collection(db, collectionName);
    
    // Create a query based on collection type
    let q: Query<DocumentData> | CollectionReference<DocumentData> = collectionRef;
    if (collectionName === COLLECTIONS.USER_ACTIVITIES) {
      q = query(collectionRef, orderBy('timestamp', 'desc'));
    } else if (collectionName === COLLECTIONS.INVENTORY_TRANSACTIONS) {
      q = query(collectionRef, orderBy('createdAt', 'desc'));
    }

    return onSnapshot(q, {
      next: (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(items);
      },
      error: (error) => {
        console.error(`Error in real-time sync for ${collectionName}:`, error);
      }
    });
  },

  // Add or update a document
  async setDocument(collectionName: string, docId: string, data: any) {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
      updatedAt: serverTimestamp()
    });
  },

  // Update a document
  async updateDocument(collectionName: string, docId: string, data: any) {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp() // Use server timestamp for consistency
    });
  },

  // Delete a document
  async deleteDocument(collectionName: string, docId: string) {
    await deleteDoc(doc(db, collectionName, docId));
  },

  // Get a single document
  async getDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Get all documents in a collection
  async getCollection(collectionName: string) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get documents by field value
  async getDocumentsByField(collectionName: string, field: string, value: any) {
    const q = query(collection(db, collectionName), where(field, '==', value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    }));
  },
};
