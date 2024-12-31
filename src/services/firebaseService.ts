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
  QueryDocumentSnapshot
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
    const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(items);
    });
  },

  // Add or update a document
  async setDocument(collectionName: string, docId: string, data: any) {
    const timestamp = new Date().getTime();
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      timestamp,
    });
  },

  // Update a document
  async updateDocument(collectionName: string, docId: string, data: any) {
    const timestamp = new Date().getTime();
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      timestamp,
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
