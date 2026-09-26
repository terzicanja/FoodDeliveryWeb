import { FulfillmentType, OrderStatus, Role } from "@prisma/client";

/**
 * Canonical order lifecycle. Role-specific maps below decide who may perform
 * each move. Pickup vs delivery constraints are enforced in service code.
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PICKED_UP],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  DELIVERED: [],
  REJECTED: [],
  CANCELLED: [],
  FAILED: [],
  PICKED_UP: [],
};

export const ADMIN_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {};

/**
 * Restaurant kitchen + pickup completion.
 * READY → PICKED_UP is only valid for PICKUP orders (enforced in service).
 */
export const RESTAURANT_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  ACCEPTED: [OrderStatus.PREPARING],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.PICKED_UP],
};

/**
 * Customer may cancel only before preparation starts.
 */
export const CUSTOMER_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: [OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.CANCELLED],
};

/**
 * Courier delivery workflow. READY → OUT_FOR_DELIVERY is DELIVERY-only.
 * OUT_FOR_DELIVERY → FAILED requires a failure note (enforced in service).
 */
export const COURIER_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  READY: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.FAILED],
};

const ROLE_ALLOWED_TRANSITIONS: Partial<
  Record<Role, Partial<Record<OrderStatus, readonly OrderStatus[]>>>
> = {
  ADMIN: ADMIN_ALLOWED_TRANSITIONS,
  RESTAURANT: RESTAURANT_ALLOWED_TRANSITIONS,
  CUSTOMER: CUSTOMER_ALLOWED_TRANSITIONS,
  COURIER: COURIER_ALLOWED_TRANSITIONS,
};

export function isValidOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  return (
    ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false
  );
}

export function getAllowedNextStatuses(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function getAllowedNextStatusesForRole(
  role: Role,
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return ROLE_ALLOWED_TRANSITIONS[role]?.[currentStatus] ?? [];
}

/**
 * True when the lifecycle allows the move AND the actor's role may perform it.
 * Does not check fulfillment type; call sites must enforce PICKUP/DELIVERY rules.
 */
export function canRoleTransitionOrderStatus(
  role: Role,
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  if (!isValidOrderStatusTransition(currentStatus, nextStatus)) {
    return false;
  }

  return getAllowedNextStatusesForRole(role, currentStatus).includes(
    nextStatus,
  );
}

export function getAdminAllowedNextStatuses(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return getAllowedNextStatusesForRole(Role.ADMIN, currentStatus);
}

export function getCourierAllowedNextStatuses(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return getAllowedNextStatusesForRole(Role.COURIER, currentStatus);
}

export function getRestaurantAllowedNextStatuses(
  currentStatus: OrderStatus,
  fulfillmentType: FulfillmentType,
): readonly OrderStatus[] {
  const allowed = getAllowedNextStatusesForRole(
    Role.RESTAURANT,
    currentStatus,
  );

  if (currentStatus !== OrderStatus.READY) {
    return allowed;
  }

  if (fulfillmentType === FulfillmentType.PICKUP) {
    return allowed.filter((status) => status === OrderStatus.PICKED_UP);
  }

  return [];
}

export function getCustomerAllowedNextStatuses(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return getAllowedNextStatusesForRole(Role.CUSTOMER, currentStatus);
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return getCustomerAllowedNextStatuses(status).includes(OrderStatus.CANCELLED);
}

/**
 * Terminal statuses that mean the customer successfully received the meal.
 * Used for review eligibility (delivery and pickup).
 */
export const REVIEWABLE_ORDER_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.PICKED_UP,
] as const;

export function isReviewableOrderStatus(
  status: OrderStatus | string,
): boolean {
  return (
    status === OrderStatus.DELIVERED || status === OrderStatus.PICKED_UP
  );
}
