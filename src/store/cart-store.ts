import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  pricePerUnitPaise: number;
  unit: string;
  image: string;
  quantity: number;
  selectedColor?: string;
  notes?: string;
}

export interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const STORAGE_KEY = 'excellence_cart_items';

function loadInitialItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: typeof window !== 'undefined' ? loadInitialItems() : [],

  addItem: (item) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const current = get().items;
    const existingIndex = current.findIndex((i) => i.productId === item.productId);

    let updated: CartItem[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
      };
    } else {
      updated = [...current, { ...item, quantity: qty }];
    }

    set({ items: updated });
    saveItems(updated);
  },

  removeItem: (productId: string) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    set({ items: updated });
    saveItems(updated);
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    set({ items: updated });
    saveItems(updated);
  },

  clearCart: () => {
    set({ items: [] });
    saveItems([]);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
