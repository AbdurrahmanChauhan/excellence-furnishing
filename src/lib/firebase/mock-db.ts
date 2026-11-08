import { Product } from '@/types/product';
import { Client } from '@/types/client';
import { Room } from '@/types/room';
import { RoomMeasurement } from '@/types/measurement';
import { Order } from '@/types/order';
import { Invoice } from '@/types/invoice';
import { UserProfile } from '@/types/user';
import {
  SEEDED_PRODUCTS,
  SEEDED_CLIENTS,
  SEEDED_ROOMS,
  SEEDED_MEASUREMENTS,
  SEEDED_ORDERS,
  SEEDED_INVOICES,
  SEEDED_USERS,
} from './seed-data';

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  colors?: string[];
  materials?: string[];
  patterns?: string[];
  isFeatured?: boolean;
  isAvailable?: boolean;
}

class MockDatabase {
  private products: Map<string, Product> = new Map();
  private clients: Map<string, Client> = new Map();
  private rooms: Map<string, Room> = new Map();
  private measurements: Map<string, RoomMeasurement> = new Map();
  private orders: Map<string, Order> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private users: Map<string, UserProfile> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.products.clear();
    this.clients.clear();
    this.rooms.clear();
    this.measurements.clear();
    this.orders.clear();
    this.invoices.clear();
    this.users.clear();

    for (const p of SEEDED_PRODUCTS) {
      this.products.set(p.id, structuredClone(p));
    }
    for (const c of SEEDED_CLIENTS) {
      this.clients.set(c.id, structuredClone(c));
    }
    for (const r of SEEDED_ROOMS) {
      this.rooms.set(r.id, structuredClone(r));
    }
    for (const m of SEEDED_MEASUREMENTS) {
      this.measurements.set(m.id, structuredClone(m));
    }
    for (const o of SEEDED_ORDERS) {
      this.orders.set(o.id, structuredClone(o));
    }
    for (const inv of SEEDED_INVOICES) {
      this.invoices.set(inv.id, structuredClone(inv));
    }
    for (const u of SEEDED_USERS) {
      this.users.set(u.uid, structuredClone(u));
    }
  }

  // --- Products ---
  public getAllProducts(filters?: ProductFilters): Product[] {
    let list = Array.from(this.products.values());

    if (!filters) return structuredClone(list);

    if (filters.category && filters.category !== 'all') {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters.subcategory && filters.subcategory !== 'all') {
      list = list.filter((p) => p.subcategory === filters.subcategory);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.minPricePaise !== undefined) {
      list = list.filter((p) => p.pricePerUnitPaise >= filters.minPricePaise!);
    }
    if (filters.maxPricePaise !== undefined) {
      list = list.filter((p) => p.pricePerUnitPaise <= filters.maxPricePaise!);
    }
    if (filters.colors && filters.colors.length > 0) {
      list = list.filter((p) =>
        filters.colors!.some((c) => p.colors.some((pc) => pc.toLowerCase() === c.toLowerCase()))
      );
    }
    if (filters.materials && filters.materials.length > 0) {
      list = list.filter((p) =>
        filters.materials!.some((m) =>
          p.materials.some((pm) => pm.toLowerCase().includes(m.toLowerCase()))
        )
      );
    }
    if (filters.patterns && filters.patterns.length > 0) {
      list = list.filter((p) =>
        filters.patterns!.some(
          (pat) =>
            typeof pat === 'string' &&
            p.patterns.some((pp) => pp.toLowerCase() === pat.toLowerCase())
        )
      );
    }
    if (filters.isFeatured !== undefined) {
      list = list.filter((p) => p.isFeatured === filters.isFeatured);
    }
    if (filters.isAvailable !== undefined) {
      list = list.filter((p) => p.isAvailable === filters.isAvailable);
    }

    return structuredClone(list);
  }

  public getProductById(id: string): Product | null {
    const p = this.products.get(id);
    return p ? structuredClone(p) : null;
  }

  public getProductBySlug(slug: string): Product | null {
    for (const p of Array.from(this.products.values())) {
      if (p.slug === slug) return structuredClone(p);
    }
    return null;
  }

  public createProduct(product: Product): Product {
    const cloned = structuredClone(product);
    this.products.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const existing = this.products.get(id);
    if (!existing) return null;
    const updated: Product = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.products.set(id, updated);
    return structuredClone(updated);
  }

  public deleteProduct(id: string): boolean {
    return this.products.delete(id);
  }

  // --- Clients ---
  public getAllClients(searchQuery?: string): Client[] {
    const list = Array.from(this.clients.values());
    if (!searchQuery) return structuredClone(list);
    const q = searchQuery.toLowerCase().trim();
    const filtered = list.filter(
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
    return structuredClone(filtered);
  }

  public getClientById(id: string): Client | null {
    const c = this.clients.get(id);
    return c ? structuredClone(c) : null;
  }

  public createClient(client: Client): Client {
    const cloned = structuredClone(client);
    this.clients.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateClient(id: string, updates: Partial<Client>): Client | null {
    const existing = this.clients.get(id);
    if (!existing) return null;
    const updated: Client = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.clients.set(id, updated);
    return structuredClone(updated);
  }

  public deleteClient(id: string): boolean {
    return this.clients.delete(id);
  }

  // --- Rooms ---
  public getRoomsByClientId(clientId: string): Room[] {
    const list = Array.from(this.rooms.values()).filter((r) => r.clientId === clientId);
    return structuredClone(list);
  }

  public getRoomById(roomId: string): Room | null {
    const r = this.rooms.get(roomId);
    return r ? structuredClone(r) : null;
  }

  public createRoom(room: Room): Room {
    const cloned = structuredClone(room);
    this.rooms.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateRoom(roomId: string, updates: Partial<Room>): Room | null {
    const existing = this.rooms.get(roomId);
    if (!existing) return null;
    const updated: Room = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.rooms.set(roomId, updated);
    return structuredClone(updated);
  }

  // --- Measurements ---
  public getMeasurementsByRoom(roomId: string): RoomMeasurement[] {
    const list = Array.from(this.measurements.values()).filter((m) => m.roomId === roomId);
    return structuredClone(list);
  }

  public getMeasurementsByClient(clientId: string): RoomMeasurement[] {
    const list = Array.from(this.measurements.values()).filter((m) => m.clientId === clientId);
    return structuredClone(list);
  }

  public getMeasurementById(id: string): RoomMeasurement | null {
    const m = this.measurements.get(id);
    return m ? structuredClone(m) : null;
  }

  public createMeasurement(measurement: RoomMeasurement): RoomMeasurement {
    const cloned = structuredClone(measurement);
    this.measurements.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateMeasurement(id: string, updates: Partial<RoomMeasurement>): RoomMeasurement | null {
    const existing = this.measurements.get(id);
    if (!existing) return null;
    const updated: RoomMeasurement = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.measurements.set(id, updated);
    return structuredClone(updated);
  }

  // --- Orders ---
  public getAllOrders(filters?: { clientId?: string; userId?: string; status?: string }): Order[] {
    let list = Array.from(this.orders.values());
    if (!filters) return structuredClone(list);
    if (filters.clientId) {
      list = list.filter((o) => o.clientId === filters.clientId);
    }
    if (filters.userId) {
      const q = filters.userId.toLowerCase();
      list = list.filter((o) => o.userId === filters.userId || o.clientEmail?.toLowerCase() === q);
    }
    if (filters.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    return structuredClone(list);
  }

  public getOrderById(id: string): Order | null {
    const o = this.orders.get(id);
    return o ? structuredClone(o) : null;
  }

  public createOrder(order: Order): Order {
    const cloned = structuredClone(order);
    this.orders.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | null {
    const existing = this.orders.get(id);
    if (!existing) return null;
    const updated: Order = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.orders.set(id, updated);
    return structuredClone(updated);
  }

  // --- Invoices ---
  public getAllInvoices(filters?: { clientId?: string; orderId?: string }): Invoice[] {
    let list = Array.from(this.invoices.values());
    if (!filters) return structuredClone(list);
    if (filters.clientId) {
      list = list.filter((i) => i.clientId === filters.clientId);
    }
    if (filters.orderId) {
      list = list.filter((i) => i.orderId === filters.orderId);
    }
    return structuredClone(list);
  }

  public getInvoiceById(id: string): Invoice | null {
    const inv = this.invoices.get(id);
    return inv ? structuredClone(inv) : null;
  }

  public getInvoiceByNumber(invoiceNumber: string): Invoice | null {
    for (const inv of Array.from(this.invoices.values())) {
      if (inv.invoiceNumber === invoiceNumber) return structuredClone(inv);
    }
    return null;
  }

  public createInvoice(invoice: Invoice): Invoice {
    const cloned = structuredClone(invoice);
    this.invoices.set(cloned.id, cloned);
    return structuredClone(cloned);
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const existing = this.invoices.get(id);
    if (!existing) return null;
    const updated: Invoice = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.invoices.set(id, updated);
    return structuredClone(updated);
  }

  public getLastInvoiceNumber(): string | null {
    const list = Array.from(this.invoices.values());
    if (list.length === 0) return null;
    list.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
    return list[0].invoiceNumber;
  }

  // --- Users ---
  public getAllUsers(): UserProfile[] {
    return structuredClone(Array.from(this.users.values()));
  }

  public getUserById(uid: string): UserProfile | null {
    const u = this.users.get(uid);
    return u ? structuredClone(u) : null;
  }

  public getUserByEmail(email: string): UserProfile | null {
    const target = email.toLowerCase().trim();
    for (const u of Array.from(this.users.values())) {
      if (u.email.toLowerCase().trim() === target) {
        return structuredClone(u);
      }
    }
    return null;
  }

  public createUser(user: UserProfile): UserProfile {
    const cloned = structuredClone(user);
    this.users.set(cloned.uid, cloned);
    return structuredClone(cloned);
  }

  public updateUser(uid: string, updates: Partial<UserProfile>): UserProfile | null {
    const existing = this.users.get(uid);
    if (!existing) return null;
    const updated: UserProfile = structuredClone({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    this.users.set(uid, updated);
    return structuredClone(updated);
  }
}

// Global thread-safe singleton
export const mockDb = new MockDatabase();
