"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCart } from "@/context/CartProvider";
import type { CartItemInput } from "@/lib/cart";

type AddToCartButtonProps = {
  item: CartItemInput;
};

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const { addItem, clearAndAddItem } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setJustAdded(false);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [justAdded]);

  const markAdded = () => {
    setJustAdded(true);
  };

  const handleAdd = () => {
    const result = addItem(item);

    if (result === "requires_clear") {
      setShowConfirm(true);
      return;
    }

    markAdded();
  };

  const handleConfirmReplace = () => {
    clearAndAddItem(item);
    setShowConfirm(false);
    markAdded();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700"
      >
        {justAdded ? "Added!" : "Add to Cart"}
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Start a new order?"
        description="Your cart has items from another restaurant. Clear the current cart and add this meal instead?"
        confirmLabel="Clear cart & add"
        cancelLabel="Keep current cart"
        onConfirm={handleConfirmReplace}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
