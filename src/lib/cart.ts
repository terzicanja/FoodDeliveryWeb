export const CART_STORAGE_KEY = "food-delivery-cart";

export type CartItem = {
  mealId: number;
  restaurantId: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

export type CartItemInput = Omit<CartItem, "quantity">;

export type AddToCartResult = "added" | "requires_clear";

export function getCartRestaurantId(items: CartItem[]): number | null {
  return items[0]?.restaurantId ?? null;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function addItemToCart(
  items: CartItem[],
  incoming: CartItemInput,
): { items: CartItem[]; result: AddToCartResult } {
  const currentRestaurantId = getCartRestaurantId(items);

  if (
    currentRestaurantId !== null &&
    currentRestaurantId !== incoming.restaurantId
  ) {
    return { items, result: "requires_clear" };
  }

  const existingIndex = items.findIndex(
    (item) => item.mealId === incoming.mealId,
  );

  if (existingIndex === -1) {
    return {
      items: [...items, { ...incoming, quantity: 1 }],
      result: "added",
    };
  }

  const nextItems = items.map((item, index) =>
    index === existingIndex
      ? { ...item, quantity: item.quantity + 1 }
      : item,
  );

  return { items: nextItems, result: "added" };
}

export function removeItemFromCart(
  items: CartItem[],
  mealId: number,
): CartItem[] {
  return items.filter((item) => item.mealId !== mealId);
}

export function increaseItemQuantity(
  items: CartItem[],
  mealId: number,
): CartItem[] {
  return items.map((item) =>
    item.mealId === mealId ? { ...item, quantity: item.quantity + 1 } : item,
  );
}

export function decreaseItemQuantity(
  items: CartItem[],
  mealId: number,
): CartItem[] {
  return items
    .map((item) =>
      item.mealId === mealId ? { ...item, quantity: item.quantity - 1 } : item,
    )
    .filter((item) => item.quantity > 0);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.mealId === "number" &&
    typeof item.restaurantId === "number" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    (typeof item.image === "string" || item.image === null) &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
}

export function parseCartItems(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const items = parsed.filter(isCartItem);
    const restaurantId = getCartRestaurantId(items);

    // Guard against corrupted multi-restaurant carts.
    if (
      restaurantId !== null &&
      items.some((item) => item.restaurantId !== restaurantId)
    ) {
      return [];
    }

    return items;
  } catch {
    return [];
  }
}
