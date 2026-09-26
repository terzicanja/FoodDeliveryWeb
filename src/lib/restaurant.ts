import {
  FulfillmentType,
  OrderStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { canRoleTransitionOrderStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import type {
  AcceptRestaurantOrderInput,
  CreateMealInput,
  UpdateMealInput,
} from "@/lib/validations/restaurant";

export type RestaurantErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_TRANSITION"
  | "BAD_REQUEST";

export class RestaurantActionError extends Error {
  readonly code: RestaurantErrorCode;
  readonly status: 400 | 404 | 409;

  constructor(code: RestaurantErrorCode, message: string) {
    super(message);
    this.name = "RestaurantActionError";
    this.code = code;
    this.status =
      code === "NOT_FOUND" ? 404 : code === "CONFLICT" ? 409 : 400;
  }
}

const restaurantMealSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  images: true,
  restaurantId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      orderItems: true,
      reviews: true,
    },
  },
} satisfies Prisma.MealSelect;

export type RestaurantMeal = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  restaurantId: number;
  createdAt: Date;
  updatedAt: Date;
  orderItemCount: number;
  reviewCount: number;
};

function serializeMeal(
  meal: Prisma.MealGetPayload<{ select: typeof restaurantMealSelect }>,
): RestaurantMeal {
  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
    price: meal.price.toFixed(2),
    images: meal.images,
    restaurantId: meal.restaurantId,
    createdAt: meal.createdAt,
    updatedAt: meal.updatedAt,
    orderItemCount: meal._count.orderItems,
    reviewCount: meal._count.reviews,
  };
}

export const restaurantOrderListSelect = {
  id: true,
  status: true,
  fulfillmentType: true,
  paymentMethod: true,
  paymentStatus: true,
  totalPrice: true,
  orderAddress: true,
  estimatedDeliveryTime: true,
  note: true,
  failureNote: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
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

type RestaurantOrderRecord = Prisma.OrderGetPayload<{
  select: typeof restaurantOrderListSelect;
}>;

export type RestaurantOrderListItem = Omit<RestaurantOrderRecord, "user"> & {
  customer: RestaurantOrderRecord["user"];
};

function mapRestaurantOrder(
  order: RestaurantOrderRecord,
): RestaurantOrderListItem {
  const { user, ...rest } = order;
  return {
    ...rest,
    customer: user,
  };
}

export async function getMealsForRestaurant(
  restaurantId: number,
): Promise<RestaurantMeal[]> {
  const meals = await prisma.meal.findMany({
    where: { restaurantId },
    select: restaurantMealSelect,
    orderBy: { name: "asc" },
  });

  return meals.map(serializeMeal);
}

export async function createMealForRestaurant(params: {
  restaurantId: number;
  input: CreateMealInput;
}): Promise<RestaurantMeal> {
  const meal = await prisma.meal.create({
    data: {
      name: params.input.name,
      description: params.input.description,
      price: new Prisma.Decimal(params.input.price.toFixed(2)),
      images: params.input.images,
      restaurantId: params.restaurantId,
    },
    select: restaurantMealSelect,
  });

  return serializeMeal(meal);
}

export async function updateMealForRestaurant(params: {
  restaurantId: number;
  mealId: number;
  input: UpdateMealInput;
}): Promise<RestaurantMeal> {
  const meal = await prisma.meal.findFirst({
    where: {
      id: params.mealId,
      restaurantId: params.restaurantId,
    },
    select: { id: true },
  });

  if (!meal) {
    throw new RestaurantActionError("NOT_FOUND", "Meal not found");
  }

  const updated = await prisma.meal.update({
    where: { id: meal.id },
    data: {
      name: params.input.name,
      description: params.input.description,
      price: new Prisma.Decimal(params.input.price.toFixed(2)),
      images: params.input.images,
    },
    select: restaurantMealSelect,
  });

  return serializeMeal(updated);
}

export async function deleteMealForRestaurant(params: {
  restaurantId: number;
  mealId: number;
}): Promise<void> {
  const meal = await prisma.meal.findFirst({
    where: {
      id: params.mealId,
      restaurantId: params.restaurantId,
    },
    select: {
      id: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
  });

  if (!meal) {
    throw new RestaurantActionError("NOT_FOUND", "Meal not found");
  }

  const blockers: string[] = [];

  if (meal._count.orderItems > 0) {
    blockers.push("order items");
  }

  if (meal._count.reviews > 0) {
    blockers.push("reviews");
  }

  if (blockers.length > 0) {
    throw new RestaurantActionError(
      "CONFLICT",
      `This meal cannot be deleted while related ${blockers.join(", ")} exist.`,
    );
  }

  await prisma.meal.delete({ where: { id: meal.id } });
}

export async function getOrdersForRestaurant(
  restaurantId: number,
): Promise<RestaurantOrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: { restaurantId },
    select: restaurantOrderListSelect,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapRestaurantOrder);
}

async function findOwnedOrder(params: {
  restaurantId: number;
  orderId: number;
}) {
  return prisma.order.findFirst({
    where: {
      id: params.orderId,
      restaurantId: params.restaurantId,
    },
    select: {
      id: true,
      status: true,
      fulfillmentType: true,
    },
  });
}

export async function acceptRestaurantOrder(params: {
  restaurantId: number;
  orderId: number;
  input: AcceptRestaurantOrderInput;
}): Promise<RestaurantOrderListItem> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: params.orderId,
        restaurantId: params.restaurantId,
      },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new RestaurantActionError("NOT_FOUND", "Order not found");
    }

    if (
      !canRoleTransitionOrderStatus(
        Role.RESTAURANT,
        order.status,
        OrderStatus.ACCEPTED,
      )
    ) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        `Cannot accept an order with status ${order.status}`,
      );
    }

    const updatedCount = await tx.order.updateMany({
      where: {
        id: order.id,
        restaurantId: params.restaurantId,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.ACCEPTED,
        estimatedDeliveryTime: params.input.estimatedDeliveryTime,
      },
    });

    if (updatedCount.count !== 1) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        "Order is no longer pending and cannot be accepted",
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: restaurantOrderListSelect,
    });

    return mapRestaurantOrder(updated);
  });
}

export async function rejectRestaurantOrder(params: {
  restaurantId: number;
  orderId: number;
}): Promise<RestaurantOrderListItem> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: params.orderId,
        restaurantId: params.restaurantId,
      },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new RestaurantActionError("NOT_FOUND", "Order not found");
    }

    if (
      !canRoleTransitionOrderStatus(
        Role.RESTAURANT,
        order.status,
        OrderStatus.REJECTED,
      )
    ) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        `Cannot reject an order with status ${order.status}`,
      );
    }

    const updatedCount = await tx.order.updateMany({
      where: {
        id: order.id,
        restaurantId: params.restaurantId,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.REJECTED,
      },
    });

    if (updatedCount.count !== 1) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        "Order is no longer pending and cannot be rejected",
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: restaurantOrderListSelect,
    });

    return mapRestaurantOrder(updated);
  });
}

export async function updateRestaurantOrderStatus(params: {
  restaurantId: number;
  orderId: number;
  nextStatus: OrderStatus;
}): Promise<RestaurantOrderListItem> {
  const allowedNext = [
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.PICKED_UP,
  ] as const;

  if (
    !allowedNext.includes(
      params.nextStatus as (typeof allowedNext)[number],
    )
  ) {
    throw new RestaurantActionError(
      "BAD_REQUEST",
      `Restaurant cannot set status to ${params.nextStatus}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: params.orderId,
        restaurantId: params.restaurantId,
      },
      select: {
        id: true,
        status: true,
        fulfillmentType: true,
      },
    });

    if (!order) {
      throw new RestaurantActionError("NOT_FOUND", "Order not found");
    }

    if (
      !canRoleTransitionOrderStatus(
        Role.RESTAURANT,
        order.status,
        params.nextStatus,
      )
    ) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    if (params.nextStatus === OrderStatus.PICKED_UP) {
      if (order.fulfillmentType !== FulfillmentType.PICKUP) {
        throw new RestaurantActionError(
          "INVALID_TRANSITION",
          "Only pickup orders can be marked as picked up",
        );
      }

      if (order.status !== OrderStatus.READY) {
        throw new RestaurantActionError(
          "INVALID_TRANSITION",
          "Only ready pickup orders can be marked as picked up",
        );
      }
    }

    const updatedCount = await tx.order.updateMany({
      where: {
        id: order.id,
        restaurantId: params.restaurantId,
        status: order.status,
        ...(params.nextStatus === OrderStatus.PICKED_UP
          ? { fulfillmentType: FulfillmentType.PICKUP }
          : {}),
      },
      data: {
        status: params.nextStatus,
      },
    });

    if (updatedCount.count !== 1) {
      throw new RestaurantActionError(
        "INVALID_TRANSITION",
        `Cannot change order status from ${order.status} to ${params.nextStatus}`,
      );
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: restaurantOrderListSelect,
    });

    return mapRestaurantOrder(updated);
  });
}

export { findOwnedOrder };
