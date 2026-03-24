import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, DEFAULT_SETTINGS } from './menuData';

// ─── SEED DATABASE ─────────────────────────────────────────────────────────
export async function seedDatabase() {
  const settingsRef = doc(db, 'settings', 'main');
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) return; // Already seeded

  const batch = writeBatch(db);

  // Settings
  batch.set(settingsRef, { ...DEFAULT_SETTINGS, createdAt: serverTimestamp() });

  // Categories
  for (const cat of INITIAL_CATEGORIES) {
    batch.set(doc(db, 'categories', cat.id), { ...cat, createdAt: serverTimestamp() });
  }

  // Menu items
  for (const item of INITIAL_MENU_ITEMS) {
    batch.set(doc(db, 'menuItems', item.id), { ...item, createdAt: serverTimestamp() });
  }

  await batch.commit();
  console.log('Database seeded successfully');
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────
export async function getSettings() {
  const snap = await getDoc(doc(db, 'settings', 'main'));
  return snap.exists() ? snap.data() : DEFAULT_SETTINGS;
}

export async function updateSettings(updates) {
  await updateDoc(doc(db, 'settings', 'main'), { ...updates, updatedAt: serverTimestamp() });
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────
export async function getCategories() {
  const q = query(collection(db, 'categories'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCategory(data) {
  const ref = doc(collection(db, 'categories'));
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateCategory(id, data) {
  await updateDoc(doc(db, 'categories', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'categories', id));
}

// ─── MENU ITEMS ────────────────────────────────────────────────────────────
export async function getMenuItems() {
  const q = query(collection(db, 'menuItems'), orderBy('categoryId'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addMenuItem(data) {
  const ref = doc(collection(db, 'menuItems'));
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMenuItem(id, data) {
  await updateDoc(doc(db, 'menuItems', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, 'menuItems', id));
}

// ─── ORDERS ────────────────────────────────────────────────────────────────
export async function createOrder(orderData) {
  // Generate order number
  const orderNumber = `QB-${Date.now().toString().slice(-6)}`;
  const ref = doc(collection(db, 'orders'));
  const order = {
    ...orderData,
    id: ref.id,
    orderNumber,
    kitchenId: 'kitchen-1', // Default kitchen — expandable when more kitchens added
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, order);
  return { id: ref.id, orderNumber };
}

export async function updateOrderStatus(orderId, status, extra = {}) {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Real-time listener for active orders — filtered by kitchenId
export function subscribeToActiveOrders(kitchenId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('kitchenId', '==', kitchenId),
    where('status', 'in', ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// Real-time listener for ALL orders for a specific kitchen (for reports)
export function subscribeToKitchenOrders(kitchenId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('kitchenId', '==', kitchenId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// Real-time listener for a specific order (Customer tracking)
export function subscribeToOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// All orders for admin (all kitchens)
export function subscribeToAllOrders(callback) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// ─── IMAGE UPLOAD ──────────────────────────────────────────────────────────
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadMenuItemImage(file, itemId, onProgress) {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `menu-images/${itemId}.${ext}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

export async function deleteMenuItemImage(imageUrl) {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (e) {
    // Ignore if file doesn't exist
  }
}
