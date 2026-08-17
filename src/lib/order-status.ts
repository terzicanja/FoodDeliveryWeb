import { OrderStatus, Role } from "@prisma/client";

/**
 * Canonical order lifecycle. Every allowed move is a single step.
 * Courier-owned steps (READY → OUT_FOR_DELIVERY → DELIVERED) live here so
 * future courier endpoints can reuse the same rules.
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  ACCEPTED: [OrderStatus.PREPARING],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  REJECTED: [],
};

/**
 * Admin kitchen workflow. Delivery transitions are courier-only.
 */
export const ADMIN_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  ACCEPTED: [OrderStatus.PREPARING],
  PREPARING: [OrderStatus.READY],
};

/**
 * Courier delivery workflow. Not exposed on admin endpoints.
 */
export const COURIER_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  READY: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
};

const ROLE_ALLOWED_TRANSITIONS: Partial<
  Record<Role, Partial<Record<OrderStatus, readonly OrderStatus[]>>>
> = {
  ADMIN: ADMIN_ALLOWED_TRANSITIONS,
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
 * True only when the lifecycle allows the move AND the actor's role may perform it.
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
