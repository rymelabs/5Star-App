import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getFirebaseDb } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const RecycleBinContext = createContext();

export const useRecycleBin = () => {
  const context = useContext(RecycleBinContext);
  if (!context) {
    throw new Error('useRecycleBin must be used within a RecycleBinProvider');
  }
  return context;
};

// Default retention period in days
const DEFAULT_RETENTION_DAYS = 30;

export const RecycleBinProvider = ({ children }) => {
  const { user } = useAuth();
  const [recycleBinItems, setRecycleBinItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retentionDays, setRetentionDays] = useState(DEFAULT_RETENTION_DAYS);

  const ownerId = user?.uid || null;
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;

  // Collection name for recycle bin
  const RECYCLE_BIN_COLLECTION = 'recycleBin';

  // Load recycle bin items
  const loadRecycleBinItems = useCallback(async () => {
    if (!ownerId || !isAdmin) {
      setRecycleBinItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const database = getFirebaseDb();
      const recycleBinRef = collection(database, RECYCLE_BIN_COLLECTION);
      
      let q;
      if (isSuperAdmin) {
        // Super admins can see all deleted items
        q = query(recycleBinRef, orderBy('deletedAt', 'desc'));
      } else {
        // Regular admins can only see their own deleted items
        q = query(
          recycleBinRef, 
          where('ownerId', '==', ownerId),
          orderBy('deletedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        recycleBinId: doc.id,
        deletedAt: doc.data().deletedAt?.toDate?.() || new Date(doc.data().deletedAt)
      }));

      setRecycleBinItems(items);
    } catch (error) {
      setRecycleBinItems([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, isAdmin, isSuperAdmin]);

  // Load items on mount and when user changes
  useEffect(() => {
    loadRecycleBinItems();
  }, [loadRecycleBinItems]);

  // Auto-cleanup expired items
  useEffect(() => {
    if (!ownerId || !isAdmin) return;

    const cleanupExpiredItems = async () => {
      try {
        const database = getFirebaseDb();
        const recycleBinRef = collection(database, RECYCLE_BIN_COLLECTION);
        
        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - retentionDays);

        let q;
        if (isSuperAdmin) {
          q = query(recycleBinRef);
        } else {
          q = query(recycleBinRef, where('ownerId', '==', ownerId));
        }

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(database);
        let hasExpired = false;

        querySnapshot.docs.forEach(docSnapshot => {
          const data = docSnapshot.data();
          const deletedAt = data.deletedAt?.toDate?.() || new Date(data.deletedAt);
          
          if (deletedAt < expirationDate) {
            batch.delete(docSnapshot.ref);
            hasExpired = true;
          }
        });

        if (hasExpired) {
          await batch.commit();
          loadRecycleBinItems(); // Refresh the list
        }
      } catch (error) {
        /* ignore cleanup failures */
      }
    };

    // Run cleanup on mount
    cleanupExpiredItems();

    // Run cleanup every hour
    const interval = setInterval(cleanupExpiredItems, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [ownerId, isAdmin, isSuperAdmin, retentionDays, loadRecycleBinItems]);

  // Move item to recycle bin (soft delete)
  const moveToRecycleBin = async (item, itemType, collectionName) => {
    if (!ownerId) {
      throw new Error('User not authenticated');
    }

    try {
      const database = getFirebaseDb();
      
      // Create a unique ID for the recycle bin item
      const recycleBinId = `${collectionName}_${item.id}_${Date.now()}`;
      
      // Store the item in recycle bin with metadata
      const recycleBinItem = {
        ...item,
        originalId: item.id,
        originalCollection: collectionName,
        itemType: itemType,
        ownerId: item.ownerId || ownerId,
        ownerName: item.ownerName || user?.displayName || user?.email || 'Unknown',
        deletedAt: serverTimestamp(),
        deletedBy: ownerId,
        deletedByName: user?.displayName || user?.email || 'Unknown',
        expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      };

      // Save to recycle bin
      await setDoc(doc(database, RECYCLE_BIN_COLLECTION, recycleBinId), recycleBinItem);

      // Delete from original collection
      await deleteDoc(doc(database, collectionName, item.id));

      // Refresh recycle bin
      loadRecycleBinItems();

      return recycleBinId;
    } catch (error) {
      throw error;
    }
  };

  // Restore item from recycle bin
  const restoreFromRecycleBin = async (recycleBinId) => {
    if (!ownerId) {
      throw new Error('User not authenticated');
    }

    try {
      const database = getFirebaseDb();
      const recycleBinDocRef = doc(database, RECYCLE_BIN_COLLECTION, recycleBinId);
      const recycleBinDoc = await getDoc(recycleBinDocRef);

      if (!recycleBinDoc.exists()) {
        throw new Error('Item not found in recycle bin');
      }

      const data = recycleBinDoc.data();

      // Check ownership (unless super admin)
      if (!isSuperAdmin && data.ownerId !== ownerId) {
        throw new Error('You do not have permission to restore this item');
      }

      // Extract original item data (remove recycle bin metadata)
      const { 
        recycleBinId: _rbId, 
        originalCollection, 
        originalId, 
        itemType, 
        deletedAt, 
        deletedBy, 
        deletedByName, 
        expiresAt,
        ...originalItem 
      } = data;

      // Restore to original collection
      await setDoc(doc(database, originalCollection, originalId), {
        ...originalItem,
        id: originalId,
        restoredAt: serverTimestamp(),
        restoredBy: ownerId
      });

      // Delete from recycle bin
      await deleteDoc(recycleBinDocRef);

      // Refresh recycle bin
      loadRecycleBinItems();

      return originalId;
    } catch (error) {
      throw error;
    }
  };

  // Permanently delete item from recycle bin
  const permanentlyDelete = async (recycleBinId) => {
    if (!ownerId) {
      throw new Error('User not authenticated');
    }

    try {
      const database = getFirebaseDb();
      const recycleBinDocRef = doc(database, RECYCLE_BIN_COLLECTION, recycleBinId);
      const recycleBinDoc = await getDoc(recycleBinDocRef);

      if (!recycleBinDoc.exists()) {
        throw new Error('Item not found in recycle bin');
      }

      const data = recycleBinDoc.data();

      // Check ownership (unless super admin)
      if (!isSuperAdmin && data.ownerId !== ownerId) {
        throw new Error('You do not have permission to delete this item');
      }

      // Permanently delete
      await deleteDoc(recycleBinDocRef);

      // Refresh recycle bin
      loadRecycleBinItems();
    } catch (error) {
      throw error;
    }
  };

  // Empty entire recycle bin (for current user or all if super admin)
  const emptyRecycleBin = async () => {
    if (!ownerId) {
      throw new Error('User not authenticated');
    }

    try {
      const database = getFirebaseDb();
      const recycleBinRef = collection(database, RECYCLE_BIN_COLLECTION);
      
      let q;
      if (isSuperAdmin) {
        q = query(recycleBinRef);
      } else {
        q = query(recycleBinRef, where('ownerId', '==', ownerId));
      }

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(database);

      querySnapshot.docs.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();

      // Refresh recycle bin
      loadRecycleBinItems();
    } catch (error) {
      throw error;
    }
  };

  // Get days until expiration for an item
  const getDaysUntilExpiration = (deletedAt) => {
    const now = new Date();
    const deleted = new Date(deletedAt);
    const expiresAt = new Date(deleted.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  // Filtered items for current user
  const ownedRecycleBinItems = useMemo(() => {
    if (isSuperAdmin) return recycleBinItems;
    if (!isAdmin) return [];
    return recycleBinItems.filter(item => item.ownerId === ownerId);
  }, [recycleBinItems, isAdmin, isSuperAdmin, ownerId]);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups = {};
    ownedRecycleBinItems.forEach(item => {
      const type = item.itemType || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    });
    return groups;
  }, [ownedRecycleBinItems]);

  const value = {
    recycleBinItems: ownedRecycleBinItems,
    groupedItems,
    loading,
    retentionDays,
    setRetentionDays,
    moveToRecycleBin,
    restoreFromRecycleBin,
    permanentlyDelete,
    emptyRecycleBin,
    getDaysUntilExpiration,
    refreshRecycleBin: loadRecycleBinItems
  };

  return (
    <RecycleBinContext.Provider value={value}>
      {children}
    </RecycleBinContext.Provider>
  );
};

export default RecycleBinProvider;
