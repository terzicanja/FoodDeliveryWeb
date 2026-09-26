"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartProvider";

/**
 * Clears the client cart only after the server has confirmed a paid CARD order.
 */
export function ClearCartOnPaidOrder() {
  const { clearCart, isReady } = useCart();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    clearCart();
  }, [clearCart, isReady]);

  return null;
}
