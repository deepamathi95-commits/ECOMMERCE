import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartService, productService } from "../services";
import { computeSummary } from "../utils/cartMath";
import { parseApiError } from "../utils/format";
import { storage } from "../utils/storage";
import { useAuth } from "./AuthContext";

const GUEST_KEY = "stepup.guestCart";
const DEFAULT_RULES = { shipping_flat_rate: "5.00", free_shipping_threshold: "100.00", max_line_quantity: 10 };

const CartContext = createContext(null);
const lineKey = (l) => `${l.product_id}|${l.size}|${l.color}`;

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [guestItems, setGuestItems] = useState(() => storage.get(GUEST_KEY, []));
  const [serverCart, setServerCart] = useState({ items: [], summary: null, item_count: 0 });
  const [loading, setLoading] = useState(false);
  const syncedFor = useRef(null);

  useEffect(() => {
    productService.settings().then(setRules).catch(() => {});
  }, []);

  useEffect(() => storage.set(GUEST_KEY, guestItems), [guestItems]);

  // When a user logs in: merge the guest cart into the account cart, then use the server cart.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      syncedFor.current = null;
      setServerCart({ items: [], summary: null, item_count: 0 });
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    setLoading(true);
    const guest = storage.get(GUEST_KEY, []);
    const request = guest.length
      ? cartService.sync(guest.map(({ product_id, size, color, quantity }) => ({ product_id, size, color, quantity })))
      : cartService.get();
    request
      .then((cart) => {
        setServerCart(cart);
        setGuestItems([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const items = user ? serverCart.items : guestItems;
  const summary = useMemo(
    () => (user && serverCart.summary ? serverCart.summary : computeSummary(items, rules)),
    [user, serverCart.summary, items, rules]
  );
  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  const addItem = useCallback(
    async ({ product, size = "", color = "", quantity = 1 }) => {
      if (user) {
        const cart = await cartService.add({ product_id: product.id, size, color, quantity });
        setServerCart(cart);
        return;
      }
      const limit = Math.min(product.stock_quantity ?? rules.max_line_quantity, rules.max_line_quantity);
      const image = (product.images || []).find((i) => color && i.color === color) || (product.images || []).find((i) => !i.color) || product.images?.[0];
      const line = { product_id: product.id, size, color };
      const existing = guestItems.find((i) => lineKey(i) === lineKey(line));
      const newQty = (existing?.quantity || 0) + quantity;
      if (!product.in_stock || limit < 1) throw Object.assign(new Error("This product is out of stock."), { friendly: true });
      if (newQty > limit) throw Object.assign(new Error(`Only ${limit} available for ${product.name}.`), { friendly: true });
      const next = {
        key: lineKey(line), ...line, quantity: newQty, max_quantity: limit,
        product: { id: product.id, name: product.name, slug: product.slug, image: image?.url || product.image || "", in_stock: product.in_stock },
        unit_price: Number(product.current_price).toFixed(2), list_price: Number(product.price).toFixed(2),
        line_total: (Number(product.current_price) * newQty).toFixed(2),
      };
      setGuestItems((list) => (existing ? list.map((i) => (i.key === next.key ? next : i)) : [...list, next]));
    },
    [user, guestItems, rules]
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      if (quantity < 1) return;
      if (user) return setServerCart(await cartService.update(item.id, quantity));
      setGuestItems((list) =>
        list.map((i) =>
          i.key === item.key
            ? { ...i, quantity: Math.min(quantity, i.max_quantity), line_total: (Number(i.unit_price) * Math.min(quantity, i.max_quantity)).toFixed(2) }
            : i
        )
      );
    },
    [user]
  );

  const removeItem = useCallback(
    async (item) => {
      if (user) return setServerCart(await cartService.remove(item.id));
      setGuestItems((list) => list.filter((i) => i.key !== item.key));
    },
    [user]
  );

  const clearLocal = useCallback(() => {
    setServerCart({ items: [], summary: null, item_count: 0 });
    setGuestItems([]);
  }, []);

  const refresh = useCallback(async () => {
    if (user) setServerCart(await cartService.get());
  }, [user]);

  const value = useMemo(
    () => ({ items, summary, itemCount, loading, rules, addItem, updateQuantity, removeItem, clearLocal, refresh }),
    [items, summary, itemCount, loading, rules, addItem, updateQuantity, removeItem, clearLocal, refresh]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
export { parseApiError };
