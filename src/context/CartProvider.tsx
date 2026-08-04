"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addItemToCart,
  CART_STORAGE_KEY,
  decreaseItemQuantity,
  getCartItemCount,
  getCartRestaurantId,
  getCartTotal,
  increaseItemQuantity,
  parseCartItems,
  removeItemFromCart,
  type AddToCartResult,
  type CartItem,
  type CartItemInput,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  restaurantId: number | null;
  itemCount: number;
  totalPrice: number;
  isReady: boolean;
  addItem: (item: CartItemInput) => AddToCartResult;
  clearAndAddItem: (item: CartItemInput) => void;
  removeItem: (mealId: number) => void;
  increaseQuantity: (mealId: number) => void;
  decreaseQuantity: (mealId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    setItems(parseCartItems(stored));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const addItem = useCallback(
    (item: CartItemInput): AddToCartResult => {
      const currentRestaurantId = getCartRestaurantId(items);

      if (
        currentRestaurantId !== null &&
        currentRestaurantId !== item.restaurantId
      ) {
        return "requires_clear";
      }

      setItems((current) => addItemToCart(current, item).items);
      return "added";
    },
    [items],
  );

  const clearAndAddItem = useCallback((item: CartItemInput) => {
    setItems([{ ...item, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((mealId: number) => {
    setItems((current) => removeItemFromCart(current, mealId));
  }, []);

  const increaseQuantity = useCallback((mealId: number) => {
    setItems((current) => increaseItemQuantity(current, mealId));
  }, []);

  const decreaseQuantity = useCallback((mealId: number) => {
    setItems((current) => decreaseItemQuantity(current, mealId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      restaurantId: getCartRestaurantId(items),
      itemCount: getCartItemCount(items),
      totalPrice: getCartTotal(items),
      isReady,
      addItem,
      clearAndAddItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [
      items,
      isReady,
      addItem,
      clearAndAddItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
