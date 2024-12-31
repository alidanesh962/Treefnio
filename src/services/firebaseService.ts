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
  CollectionReference,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { Material, Product, ProductRecipe } from '../types';

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Persistence failed to enable: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Persistence not supported by browser');
    }
  });

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
  // Subscribe to a collection with real-time updates
  subscribeToCollection: (collectionName: string, onUpdate: (data: any[]) => void) => {
    const collectionRef = collection(db, collectionName);
    
    // Create a query based on collection type
    let q: Query<DocumentData> | CollectionReference<DocumentData> = collectionRef;
    
    // Add appropriate ordering for all collections
    switch(collectionName) {
      case COLLECTIONS.USER_ACTIVITIES:
      case COLLECTIONS.INVENTORY_TRANSACTIONS:
      case COLLECTIONS.PRODUCTION_BATCHES:
        q = query(collectionRef, orderBy('timestamp', 'desc'));
        break;
      case COLLECTIONS.SALES_DATA:
        q = query(collectionRef, orderBy('date', 'desc'));
        break;
      default:
        q = query(collectionRef, orderBy('updatedAt', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(items);
      }
    );
    return unsubscribe;
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
