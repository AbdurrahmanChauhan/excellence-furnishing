import { Product } from '@/types/product';
import { Client } from '@/types/client';
import { Room } from '@/types/room';
import { RoomMeasurement } from '@/types/measurement';
import { Order } from '@/types/order';
import { Invoice } from '@/types/invoice';
import { UserProfile } from '@/types/user';
import { adminDb, hasAdminCredentials } from './admin';
import { db as clientDb, hasClientCredentials } from './config';
import { mockDb, ProductFilters } from './mock-db';

/**
 * Unified async Data Layer.
 * Transparently reads and writes to Cloud Firestore when live credentials exist,
 * or routes to in-memory mock repository for local development and build stability.
 */

// --- Products ---
export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      let queryRef: FirebaseFirestore.Query = adminDb.collection('products');
      if (filters?.category && filters.category !== 'all') {
        queryRef = queryRef.where('category', '==', filters.category);
      }
      if (filters?.subcategory && filters.subcategory !== 'all') {
        queryRef = queryRef.where('subcategory', '==', filters.subcategory);
      }
      if (filters?.isAvailable !== undefined) {
        queryRef = queryRef.where('isAvailable', '==', filters.isAvailable);
      }
      if (filters?.isFeatured !== undefined) {
        queryRef = queryRef.where('isFeatured', '==', filters.isFeatured);
      }
      const snapshot = await queryRef.get();
      let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return products;
    } catch (err) {
      console.warn('Firestore fetchProducts fallback to mockDb:', err);
    }
  }
  return mockDb.getAllProducts(filters);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection('products').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Product;
      }
    } catch (err) {
      console.warn('Firestore fetchProductById fallback to mockDb:', err);
    }
  }
  return mockDb.getProductById(id);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb.collection('products').where('slug', '==', slug).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Product;
      }
    } catch (err) {
      console.warn('Firestore fetchProductBySlug fallback to mockDb:', err);
    }
  }
  return mockDb.getProductBySlug(slug);
}

export async function saveProduct(product: Product): Promise<Product> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('products').doc(product.id).set(product);
      return product;
    } catch (err) {
      console.warn('Firestore saveProduct fallback to mockDb:', err);
    }
  }
  return mockDb.createProduct(product);
}

export async function modifyProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('products').doc(id).update(updates);
      return fetchProductById(id);
    } catch (err) {
      console.warn('Firestore modifyProduct fallback to mockDb:', err);
    }
  }
  return mockDb.updateProduct(id, updates);
}

export async function removeProduct(id: string): Promise<boolean> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('products').doc(id).delete();
      return true;
    } catch (err) {
      console.warn('Firestore removeProduct fallback to mockDb:', err);
    }
  }
  return mockDb.deleteProduct(id);
}

// --- Clients ---
export async function fetchClients(query?: string): Promise<Client[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb.collection('clients').get();
      let clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
      if (query) {
        const q = query.toLowerCase();
        clients = clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.billingAddress.street.toLowerCase().includes(q) ||
            c.billingAddress.city.toLowerCase().includes(q) ||
            c.siteAddress.street.toLowerCase().includes(q) ||
            c.siteAddress.city.toLowerCase().includes(q) ||
            c.siteAddress.pincode.includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return clients;
    } catch (err) {
      console.warn('Firestore fetchClients fallback to mockDb:', err);
    }
  }
  return mockDb.getAllClients(query);
}

export async function fetchClientById(id: string): Promise<Client | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection('clients').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Client;
      }
    } catch (err) {
      console.warn('Firestore fetchClientById fallback to mockDb:', err);
    }
  }
  return mockDb.getClientById(id);
}

export async function saveClient(client: Client): Promise<Client> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('clients').doc(client.id).set(client);
      return client;
    } catch (err) {
      console.warn('Firestore saveClient fallback to mockDb:', err);
    }
  }
  return mockDb.createClient(client);
}

export async function modifyClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('clients').doc(id).update(updates);
      return fetchClientById(id);
    } catch (err) {
      console.warn('Firestore modifyClient fallback to mockDb:', err);
    }
  }
  return mockDb.updateClient(id, updates);
}

export async function removeClient(id: string): Promise<boolean> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('clients').doc(id).delete();
      return true;
    } catch (err) {
      console.warn('Firestore removeClient fallback to mockDb:', err);
    }
  }
  return mockDb.deleteClient(id);
}

// --- Rooms ---
export async function fetchRooms(clientId: string): Promise<Room[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb.collection(`clients/${clientId}/rooms`).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
    } catch (err) {
      console.warn('Firestore fetchRooms fallback to mockDb:', err);
    }
  }
  return mockDb.getRoomsByClientId(clientId);
}

export async function fetchRoomById(clientId: string, roomId: string): Promise<Room | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection(`clients/${clientId}/rooms`).doc(roomId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Room;
      }
    } catch (err) {
      console.warn('Firestore fetchRoomById fallback to mockDb:', err);
    }
  }
  return mockDb.getRoomById(roomId);
}

export async function saveRoom(room: Room): Promise<Room> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection(`clients/${room.clientId}/rooms`).doc(room.id).set(room);
      return room;
    } catch (err) {
      console.warn('Firestore saveRoom fallback to mockDb:', err);
    }
  }
  return mockDb.createRoom(room);
}

export async function modifyRoom(
  clientId: string,
  roomId: string,
  updates: Partial<Room>
): Promise<Room | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection(`clients/${clientId}/rooms`).doc(roomId).update(updates);
      return fetchRoomById(clientId, roomId);
    } catch (err) {
      console.warn('Firestore modifyRoom fallback to mockDb:', err);
    }
  }
  return mockDb.updateRoom(roomId, updates);
}

// --- Measurements ---
export async function fetchMeasurements(clientId: string, roomId: string): Promise<RoomMeasurement[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collection(`clients/${clientId}/rooms/${roomId}/measurements`)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RoomMeasurement));
    } catch (err) {
      console.warn('Firestore fetchMeasurements fallback to mockDb:', err);
    }
  }
  return mockDb.getMeasurementsByRoom(roomId);
}

export async function fetchMeasurementsByClient(clientId: string): Promise<RoomMeasurement[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collectionGroup('measurements')
        .where('clientId', '==', clientId)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RoomMeasurement));
    } catch (err) {
      console.warn('Firestore fetchMeasurementsByClient fallback to mockDb:', err);
    }
  }
  return mockDb.getMeasurementsByClient(clientId);
}

export async function fetchMeasurementById(id: string): Promise<RoomMeasurement | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collectionGroup('measurements')
        .where('id', '==', id)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as RoomMeasurement;
      }
    } catch (err) {
      console.warn('Firestore fetchMeasurementById fallback to mockDb:', err);
    }
  }
  return mockDb.getMeasurementById(id);
}

export async function saveMeasurement(measurement: RoomMeasurement): Promise<RoomMeasurement> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb
        .collection(`clients/${measurement.clientId}/rooms/${measurement.roomId}/measurements`)
        .doc(measurement.id)
        .set(measurement);
      return measurement;
    } catch (err) {
      console.warn('Firestore saveMeasurement fallback to mockDb:', err);
    }
  }
  return mockDb.createMeasurement(measurement);
}

export async function modifyMeasurement(
  id: string,
  updates: Partial<RoomMeasurement>
): Promise<RoomMeasurement | null> {
  return mockDb.updateMeasurement(id, updates);
}

// --- Orders ---
export async function fetchOrders(filters?: {
  clientId?: string;
  userId?: string;
  status?: string;
}): Promise<Order[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      let queryRef: FirebaseFirestore.Query = adminDb.collection('orders');
      if (filters?.clientId) {
        queryRef = queryRef.where('clientId', '==', filters.clientId);
      }
      if (filters?.userId) {
        queryRef = queryRef.where('userId', '==', filters.userId);
      }
      if (filters?.status) {
        queryRef = queryRef.where('status', '==', filters.status);
      }
      const snapshot = await queryRef.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
    } catch (err) {
      console.warn('Firestore fetchOrders fallback to mockDb:', err);
    }
  }
  return mockDb.getAllOrders(filters);
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection('orders').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Order;
      }
    } catch (err) {
      console.warn('Firestore fetchOrderById fallback to mockDb:', err);
    }
  }
  return mockDb.getOrderById(id);
}

export async function saveOrder(order: Order): Promise<Order> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('orders').doc(order.id).set(order);
      return order;
    } catch (err) {
      console.warn('Firestore saveOrder fallback to mockDb:', err);
    }
  }
  return mockDb.createOrder(order);
}

export async function modifyOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('orders').doc(id).update(updates);
      return fetchOrderById(id);
    } catch (err) {
      console.warn('Firestore modifyOrder fallback to mockDb:', err);
    }
  }
  return mockDb.updateOrder(id, updates);
}

// --- Invoices ---
export async function fetchInvoices(filters?: {
  clientId?: string;
  orderId?: string;
}): Promise<Invoice[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      let queryRef: FirebaseFirestore.Query = adminDb.collection('invoices');
      if (filters?.clientId) {
        queryRef = queryRef.where('clientId', '==', filters.clientId);
      }
      if (filters?.orderId) {
        queryRef = queryRef.where('orderId', '==', filters.orderId);
      }
      const snapshot = await queryRef.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
    } catch (err) {
      console.warn('Firestore fetchInvoices fallback to mockDb:', err);
    }
  }
  return mockDb.getAllInvoices(filters);
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection('invoices').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Invoice;
      }
    } catch (err) {
      console.warn('Firestore fetchInvoiceById fallback to mockDb:', err);
    }
  }
  return mockDb.getInvoiceById(id);
}

export async function fetchInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collection('invoices')
        .where('invoiceNumber', '==', invoiceNumber)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Invoice;
      }
    } catch (err) {
      console.warn('Firestore fetchInvoiceByNumber fallback to mockDb:', err);
    }
  }
  return mockDb.getInvoiceByNumber(invoiceNumber);
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('invoices').doc(invoice.id).set(invoice);
      return invoice;
    } catch (err) {
      console.warn('Firestore saveInvoice fallback to mockDb:', err);
    }
  }
  return mockDb.createInvoice(invoice);
}

export async function modifyInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('invoices').doc(id).update(updates);
      return fetchInvoiceById(id);
    } catch (err) {
      console.warn('Firestore modifyInvoice fallback to mockDb:', err);
    }
  }
  return mockDb.updateInvoice(id, updates);
}

export async function fetchLastInvoiceNumber(): Promise<string | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collection('invoices')
        .orderBy('invoiceNumber', 'desc')
        .limit(1)
        .get();
      if (!snapshot.empty) {
        return snapshot.docs[0].data().invoiceNumber;
      }
      return null;
    } catch (err) {
      console.warn('Firestore fetchLastInvoiceNumber fallback to mockDb:', err);
    }
  }
  return mockDb.getLastInvoiceNumber();
}

// --- Users & Profiles ---
export async function fetchAllUsers(): Promise<UserProfile[]> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb.collection('users').get();
      return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (err) {
      console.warn('Firestore fetchAllUsers fallback to mockDb:', err);
    }
  }
  return mockDb.getAllUsers();
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const doc = await adminDb.collection('users').doc(uid).get();
      if (doc.exists) {
        return { uid: doc.id, ...doc.data() } as UserProfile;
      }
    } catch (err) {
      console.warn('Firestore fetchUserProfile fallback to mockDb:', err);
    }
  }
  return mockDb.getUserById(uid);
}

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      const snapshot = await adminDb
        .collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as UserProfile;
      }
    } catch (err) {
      console.warn('Firestore fetchUserProfileByEmail fallback to mockDb:', err);
    }
  }
  return mockDb.getUserByEmail(email);
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('users').doc(profile.uid).set(profile);
      return profile;
    } catch (err) {
      console.warn('Firestore saveUserProfile fallback to mockDb:', err);
    }
  }
  return mockDb.createUser(profile);
}

export async function modifyUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  if (hasAdminCredentials && adminDb) {
    try {
      await adminDb.collection('users').doc(uid).update(updates);
      return fetchUserProfile(uid);
    } catch (err) {
      console.warn('Firestore modifyUserProfile fallback to mockDb:', err);
    }
  }
  return mockDb.updateUser(uid, updates);
}
