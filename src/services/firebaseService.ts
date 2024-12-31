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
  SnapshotMetadata,
  enableNetwork,
  disableNetwork
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

interface SyncMetadata {
  hasPendingWrites: boolean;
  isFromCache: boolean;
}

export const firebaseService = {
  // Network control
  enableNetwork: async () => {
    await enableNetwork(db);
  },

  disableNetwork: async () => {
    await disableNetwork(db);
  },

  // Subscribe to a collection with real-time updates
  subscribeToCollection: <T extends { id: string }>(
    collectionName: string, 
    onUpdate: (data: T[], metadata?: SyncMetadata) => void
  ) => {
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

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            _syncTime: snapshot.metadata.hasPendingWrites ? Date.now() : undefined
          } as unknown as T;
        });

        const metadata: SyncMetadata = {
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          isFromCache: snapshot.metadata.fromCache
        };

        onUpdate(items, metadata);
      },
      (error) => {
        console.error(`Error in collection ${collectionName}:`, error);
      }
    );
  },

  // Add or update a document
  async setDocument(collectionName: string, docId: string, data: any) {
    const timestamp = serverTimestamp();
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      timestamp,
      updatedAt: timestamp,
      _syncTime: Date.now()
    });
  },

  // Update a document
  async updateDocument(collectionName: string, docId: string, data: any) {
    const timestamp = serverTimestamp();
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: timestamp,
      _syncTime: Date.now()
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
