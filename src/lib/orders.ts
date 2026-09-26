import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
  type Order,
} from "@prisma/client";
import {
  canCustomerCancelOrder,
  canRoleTransitionOrderStatus,
} from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import type { CreateOrderInput } from "@/lib/validations/orders";

export type CreatedOrder = Pick<
  Order,
  "id" | "status" | "totalPrice" | "createdAt"
>;

export const customerOrderListSelect = {
  id: true,
  status: true,
  totalPrice: true,
  fulfillmentType: true,
  paymentMethod: true,
  paymentStatus: true,
  createdAt: true,
  estimatedDeliveryTime: true,
  note: true,
  failureNote: true,
  restaurant: {
    select: {
      id: true,
      name: true,
    },
  },
  items: {
    select: {
      quantity: true,
      priceAtPurchase: true,
      meal: {
        select: {
          id: true,
          name: true,
          images: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type CustomerOrderRecord = Prisma.OrderGetPayload<{
  select: typeof customerOrderListSelect;
}>;

export type CustomerOrderListItem = Omit<CustomerOrderRecord, "items"> & {
  items: Array<{
    quantity: number;
    priceAtPurchase: CustomerOrderRecord["items"][number]["priceAtPurchase"];
    meal: {
      id: number;
      name: string;
      image: string | null;
    };
    review: {
      id: number;
      rating: number;
      comment: string | null;
      createdAt: Date;
    } | null;
  }>;
};

export const adminOrderListSelect = {
  id: true,
  status: true,
  totalPrice: true,
  fulfillmentType: true,
  paymentMethod: true,
  paymentStatus: true,
  createdAt: true,
  estimatedDeliveryTime: true,
  note: true,
  failureNote: true,
  orderAddress: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  restaurant: {
    select: {
      id: true,
      name: true,
    },
  },
  courier: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  items: {
    select: {
      quantity: true,
      priceAtPurchase: true,
      meal: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type AdminOrderRecord = Prisma.OrderGetPayload<{
  select: typeof adminOrderListSelect;
}>;

export type AdminOrderListItem = Omit<AdminOrderRecord, "user"> & {
  customer: AdminOrderRecord["user"];
};

export const courierOrderListSelect = {
  id: true,
  status: true,
  totalPrice: true,
  fulfillmentType: true,
  paymentMethod: true,
  paymentStatus: true,
  createdAt: true,
  estimatedDeliveryTime: true,
  note: true,
  failureNote: true,
  orderAddress: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  restaurant: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  items: {
    select: {
      quantity: true,
      priceAtPurchase: true,
      meal: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type CourierOrderRecord = Prisma.OrderGetPayload<{
  select: typeof courierOrderListSelect;
}>;

export type CourierOrderListItem = Omit<CourierOrderRecord, "user"> & {
  customer: CourierOrderRecord["user"];
};

export type CourierOrdersForCourier = {
  available: CourierOrderListItem[];
  myOrders: CourierOrderListItem[];
};

export type ResolvedOrderItem = {
  mealId: number;
  name: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
};

export type ResolvedOrderItems = {
  restaurantId: number;
  totalPrice: Prisma.Decimal;
  items: ResolvedOrderItem[];
};

export type CreateOrderErrorCode =
  | "MEAL_NOT_FOUND"
  | "DIFFERENT_RESTAURANTS"
  | "INVALID_CUSTOMER";

export type CancelOrderErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_TRANSITION";

export type UpdateOrderStatusErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_TRANSITION";

export type CourierOrderErrorCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_AVAILABLE"
  | "INVALID_TRANSITION";

const ETA_MINUTES_ON_ACCEPTED = 45;
const ETA_MINUTES_ON_READY = 20;

export class CreateOrderError extends Error {
  readonly code: CreateOrderErrorCode;

  constructor(code: CreateOrderErrorCode, message: string) {
    super(message);
    this.name = "CreateOrderError";
    this.code = code;
  }
}

export class CancelOrderError extends Error {
  readonly code: CancelOrderErrorCode;

  constructor(code: CancelOrderErrorCode, message: string) {
    super(message);
    this.name = "CancelOrderError";
    this.code = code;
  }
}

export class UpdateOrderStatusError extends Error {
  readonly code: UpdateOrderStatusErrorCode;

  constructor(code: UpdateOrderStatusErrorCode, message: string) {
    super(message);
    this.name = "UpdateOrderStatusError";
    this.code = code;
  }
}

export class CourierOrderError extends Error {
  readonly code: CourierOrderErrorCode;

  constructor(code: CourierOrderErrorCode, message: string) {
    super(message);
    this.name = "CourierOrderError";
    this.code = code;
  }
}

type CreateOrderParams = {
  userId: number;
  restaurantId: number;
  deliveryAddress: string;
  fulfillmentType: CreateOrderInput["fulfillmentType"];
  paymentMethod: CreateOrderInput["paymentMethod"];
  paymentStatus?: PaymentStatus;
  stripeCheckoutSessionId?: string;
  note: CreateOrderInput["note"];
  items: CreateOrderInput["items"];
};

const createdOrderSelect = {
  id: true,
  status: true,
  totalPrice: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

type UpdateOrderStatusParams = {
  orderId: number;
  nextStatus: OrderStatus;
  actorRole: Role;
};

function mergeItemQuantities(
  items: CreateOrderInput["items"],
): Map<number, number> {
  const quantities = new Map<number, number>();

  for (const item of items) {
    quantities.set(
      item.mealId,
      (quantities.get(item.mealId) ?? 0) + item.quantity,
    );
  }

  return quantities;
}

type CustomerOrderWithReviews = Omit<CustomerOrderRecord, "items"> & {
  items: Array<{
    quantity: number;
    priceAtPurchase: CustomerOrderRecord["items"][number]["priceAtPurchase"];
    meal: CustomerOrderRecord["items"][number]["meal"] & {
      reviews: Array<{
        id: number;
        rating: number;
        comment: string | null;
        createdAt: Date;
      }>;
    };
  }>;
};

function mapCustomerOrder(order: CustomerOrderWithReviews): CustomerOrderListItem {
  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    fulfillmentType: order.fulfillmentType,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    note: order.note,
    failureNote: order.failureNote,
    restaurant: order.restaurant,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      meal: {
        id: item.meal.id,
        name: item.meal.name,
        image: item.meal.images[0] ?? null,
      },
      review: item.meal.reviews[0] ?? null,
    })),
  };
}

function mapAdminOrder(order: AdminOrderRecord): AdminOrderListItem {
  const { user, ...rest } = order;

  return {
    ...rest,
    customer: user,
  };
}

function mapCourierOrder(order: CourierOrderRecord): CourierOrderListItem {
  const { user, ...rest } = order;

  return {
    ...rest,
    customer: user,
  };
}

function estimatedDeliveryTimeForStatus(
  nextStatus: OrderStatus,
): number | undefined {
  if (nextStatus === OrderStatus.ACCEPTED) {
    return ETA_MINUTES_ON_ACCEPTED;
  }

  if (nextStatus === OrderStatus.READY) {
    return ETA_MINUTES_ON_READY;
  }

  return undefined;
}

/**
 * Fetch all orders for a customer, newest first.
 */
export async function getOrdersForUser(
  userId: number,
): Promise<CustomerOrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      ...customerOrderListSelect,
      items: {
        select: {
          quantity: true,
          priceAtPurchase: true,
          meal: {
            select: {
              id: true,
              name: true,
              images: true,
              reviews: {
                where: { userId },
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapCustomerOrder);
}

/**
 * Fetch every order for the admin dashboard, newest first.
 * Excludes passwordHash and other sensitive user fields.
 */
export async function getAllOrdersForAdmin(): Promise<AdminOrderListItem[]> {
  const orders = await prisma.order.findMany({
    select: adminOrderListSelect,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapAdminOrder);
}

/**
 * Apply a role-checked status transition.
 * Courier delivery steps are allowed by the lifecycle but rejected for ADMIN.
 */
export async function updateOrderStatus(
  params: UpdateOrderStatusParams,
): Promise<AdminOrderListItem> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new UpdateOrderStatusError("ORDER_NOT_FOUND", "Order not found");
    }

    if (
      !canRoleTransitionOrderStatus(
        params.actorRole,
        order.status,
        params.nextStatus,
      )
    ) {
      throw new UpdateOrderStatusError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    const estimatedDeliveryTime = estimatedDeliveryTimeForStatus(
      params.nextStatus,
    );

    const updatedCount = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: params.nextStatus,
        ...(estimatedDeliveryTime ? { estimatedDeliveryTime } : {}),
      },
    });

    if (updatedCount.count !== 1) {
      throw new UpdateOrderStatusError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: adminOrderListSelect,
    });

    return mapAdminOrder(updated);
  });
}

/**
 * Available READY/unassigned orders plus this courier's active deliveries.
 * Never includes another courier's OUT_FOR_DELIVERY orders.
 */
export async function getOrdersForCourier(
  courierId: number,
): Promise<CourierOrdersForCourier> {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        {
          status: OrderStatus.READY,
          courierId: null,
          fulfillmentType: FulfillmentType.DELIVERY,
        },
        { status: OrderStatus.OUT_FOR_DELIVERY, courierId },
      ],
    },
    select: courierOrderListSelect,
    orderBy: { createdAt: "desc" },
  });

  const mapped = orders.map(mapCourierOrder);

  return {
    available: mapped.filter((order) => order.status === OrderStatus.READY),
    myOrders: mapped.filter(
      (order) => order.status === OrderStatus.OUT_FOR_DELIVERY,
    ),
  };
}

/**
 * Atomically claim a READY unassigned order for this courier.
 */
export async function acceptCourierOrder(params: {
  orderId: number;
  courierId: number;
}): Promise<CourierOrderListItem> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        status: true,
        courierId: true,
        fulfillmentType: true,
      },
    });

    if (!order) {
      throw new CourierOrderError("ORDER_NOT_FOUND", "Order not found");
    }

    if (
      order.fulfillmentType !== FulfillmentType.DELIVERY ||
      !canRoleTransitionOrderStatus(
        Role.COURIER,
        order.status,
        OrderStatus.OUT_FOR_DELIVERY,
      ) ||
      order.courierId !== null
    ) {
      throw new CourierOrderError(
        "ORDER_NOT_AVAILABLE",
        "This order is no longer available",
      );
    }

    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.READY,
        courierId: null,
      },
      data: {
        status: OrderStatus.OUT_FOR_DELIVERY,
        courierId: params.courierId,
      },
    });

    if (claimed.count !== 1) {
      throw new CourierOrderError(
        "ORDER_NOT_AVAILABLE",
        "This order is no longer available",
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: courierOrderListSelect,
    });

    return mapCourierOrder(updated);
  });
}

/**
 * Courier may mark their own OUT_FOR_DELIVERY order as DELIVERED or FAILED.
 * FAILED requires a non-empty failure note (validated before this call).
 */
export async function deliverCourierOrder(params: {
  orderId: number;
  courierId: number;
  nextStatus: OrderStatus;
  failureNote?: string;
}): Promise<CourierOrderListItem> {
  if (
    params.nextStatus !== OrderStatus.DELIVERED &&
    params.nextStatus !== OrderStatus.FAILED
  ) {
    throw new CourierOrderError(
      "INVALID_TRANSITION",
      `Courier cannot set status to ${params.nextStatus}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, status: true, courierId: true },
    });

    if (!order) {
      throw new CourierOrderError("ORDER_NOT_FOUND", "Order not found");
    }

    if (order.courierId !== params.courierId) {
      throw new CourierOrderError("ORDER_NOT_FOUND", "Order not found");
    }

    if (
      !canRoleTransitionOrderStatus(
        Role.COURIER,
        order.status,
        params.nextStatus,
      )
    ) {
      throw new CourierOrderError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    if (params.nextStatus === OrderStatus.FAILED) {
      const note = params.failureNote?.trim() ?? "";

      if (!note) {
        throw new CourierOrderError(
          "INVALID_TRANSITION",
          "A failure note is required",
        );
      }
    }

    const updatedCount = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.OUT_FOR_DELIVERY,
        courierId: params.courierId,
      },
      data:
        params.nextStatus === OrderStatus.FAILED
          ? {
              status: OrderStatus.FAILED,
              failureNote: params.failureNote!.trim(),
            }
          : {
              status: OrderStatus.DELIVERED,
            },
    });

    if (updatedCount.count !== 1) {
      throw new CourierOrderError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: courierOrderListSelect,
    });

    return mapCourierOrder(updated);
  });
}

/**
 * Resolve cart line items against the database.
 * Prices, names, and restaurant membership come from PostgreSQL, never the client.
 */
export async function resolveOrderItems(params: {
  restaurantId: number;
  items: CreateOrderInput["items"];
}): Promise<ResolvedOrderItems> {
  const quantityByMealId = mergeItemQuantities(params.items);
  const mealIds = [...quantityByMealId.keys()];

  const meals = await prisma.meal.findMany({
    where: { id: { in: mealIds } },
    select: {
      id: true,
      name: true,
      price: true,
      restaurantId: true,
    },
  });

  if (meals.length !== mealIds.length) {
    throw new CreateOrderError(
      "MEAL_NOT_FOUND",
      "One or more meals could not be found",
    );
  }

  const restaurantIds = new Set(meals.map((meal) => meal.restaurantId));

  if (
    restaurantIds.size !== 1 ||
    !restaurantIds.has(params.restaurantId)
  ) {
    throw new CreateOrderError(
      "DIFFERENT_RESTAURANTS",
      "All meals must belong to the selected restaurant",
    );
  }

  const mealById = new Map(meals.map((meal) => [meal.id, meal]));

  let totalPrice = new Prisma.Decimal(0);
  const items = mealIds.map((mealId) => {
    const meal = mealById.get(mealId);

    if (!meal) {
      throw new CreateOrderError(
        "MEAL_NOT_FOUND",
        "One or more meals could not be found",
      );
    }

    const quantity = quantityByMealId.get(mealId) ?? 0;
    totalPrice = totalPrice.add(meal.price.mul(quantity));

    return {
      mealId: meal.id,
      name: meal.name,
      quantity,
      unitPrice: meal.price,
    };
  });

  return {
    restaurantId: params.restaurantId,
    totalPrice,
    items,
  };
}

/**
 * Create an order from cart line items.
 * Prices and restaurant are derived from the database, never from the client.
 */
export async function createOrder(
  params: CreateOrderParams,
): Promise<CreatedOrder> {
  const resolved = await resolveOrderItems({
    restaurantId: params.restaurantId,
    items: params.items,
  });

  return prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        status: OrderStatus.PENDING,
        fulfillmentType: params.fulfillmentType,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus ?? PaymentStatus.PENDING,
        stripeCheckoutSessionId: params.stripeCheckoutSessionId,
        totalPrice: resolved.totalPrice,
        orderAddress: params.deliveryAddress,
        note: params.note,
        userId: params.userId,
        restaurantId: resolved.restaurantId,
        items: {
          create: resolved.items.map((item) => ({
            mealId: item.mealId,
            quantity: item.quantity,
            priceAtPurchase: item.unitPrice,
          })),
        },
      },
      select: createdOrderSelect,
    });
  });
}

/**
 * Create a PAID CARD order from a verified Stripe Checkout Session.
 * Idempotent on stripeCheckoutSessionId, including concurrent webhook retries.
 */
export async function createPaidCardOrderForCheckoutSession(params: {
  checkoutSessionId: string;
  userId: number;
  restaurantId: number;
  deliveryAddress: string;
  fulfillmentType: CreateOrderInput["fulfillmentType"];
  note: CreateOrderInput["note"];
  items: CreateOrderInput["items"];
}): Promise<CreatedOrder> {
  const existing = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: params.checkoutSessionId },
    select: createdOrderSelect,
  });

  if (existing) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== Role.CUSTOMER) {
    throw new CreateOrderError(
      "INVALID_CUSTOMER",
      "Checkout session customer is invalid",
    );
  }

  try {
    return await createOrder({
      userId: params.userId,
      restaurantId: params.restaurantId,
      deliveryAddress: params.deliveryAddress,
      fulfillmentType: params.fulfillmentType,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.PAID,
      stripeCheckoutSessionId: params.checkoutSessionId,
      note: params.note,
      items: params.items,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrent = await prisma.order.findUnique({
        where: { stripeCheckoutSessionId: params.checkoutSessionId },
        select: createdOrderSelect,
      });

      if (concurrent) {
        return concurrent;
      }
    }

    throw error;
  }
}

/**
 * Look up a verified paid CARD order for a Checkout Session and customer.
 * Missing vs unavailable lets the success page retry only when the webhook
 * may still be creating the row.
 */
export async function findPaidCardOrderForCheckoutSession(params: {
  checkoutSessionId: string;
  userId: number;
}): Promise<
  | { status: "found"; order: CreatedOrder }
  | { status: "missing" }
  | { status: "unavailable" }
> {
  const order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: params.checkoutSessionId },
    select: {
      ...createdOrderSelect,
      userId: true,
      paymentMethod: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    return { status: "missing" };
  }

  if (
    order.userId !== params.userId ||
    order.paymentMethod !== PaymentMethod.CARD ||
    order.paymentStatus !== PaymentStatus.PAID
  ) {
    return { status: "unavailable" };
  }

  return {
    status: "found",
    order: {
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    },
  };
}

/**
 * Customer cancels their own PENDING or ACCEPTED order.
 * Uses a conditional update so a concurrent PREPARING transition wins safely.
 */
export async function cancelOrderForCustomer(params: {
  orderId: number;
  userId: number;
}): Promise<CustomerOrderListItem> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: params.orderId,
        userId: params.userId,
      },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new CancelOrderError("ORDER_NOT_FOUND", "Order not found");
    }

    if (!canCustomerCancelOrder(order.status)) {
      throw new CancelOrderError(
        "INVALID_TRANSITION",
        `Cannot cancel an order with status ${order.status}`,
      );
    }

    const updatedCount = await tx.order.updateMany({
      where: {
        id: order.id,
        userId: params.userId,
        status: { in: [OrderStatus.PENDING, OrderStatus.ACCEPTED] },
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    if (updatedCount.count !== 1) {
      throw new CancelOrderError(
        "INVALID_TRANSITION",
        "Order can no longer be cancelled",
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: {
        ...customerOrderListSelect,
        items: {
          select: {
            quantity: true,
            priceAtPurchase: true,
            meal: {
              select: {
                id: true,
                name: true,
                images: true,
                reviews: {
                  where: { userId: params.userId },
                  select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return mapCustomerOrder(updated);
  });
}
