import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  type Order,
} from "@prisma/client";
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
  paymentMethod: true,
  createdAt: true,
  estimatedDeliveryTime: true,
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
  }>;
};

export type CreateOrderErrorCode =
  | "MEAL_NOT_FOUND"
  | "DIFFERENT_RESTAURANTS";

export class CreateOrderError extends Error {
  readonly code: CreateOrderErrorCode;

  constructor(code: CreateOrderErrorCode, message: string) {
    super(message);
    this.name = "CreateOrderError";
    this.code = code;
  }
}

type CreateOrderParams = {
  userId: number;
  deliveryAddress: string;
  paymentMethod: CreateOrderInput["paymentMethod"];
  items: CreateOrderInput["items"];
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

function mapCustomerOrder(order: CustomerOrderRecord): CustomerOrderListItem {
  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    restaurant: order.restaurant,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      meal: {
        id: item.meal.id,
        name: item.meal.name,
        image: item.meal.images[0] ?? null,
      },
    })),
  };
}

/**
 * Fetch all orders for a customer, newest first.
 */
export async function getOrdersForUser(
  userId: number,
): Promise<CustomerOrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: customerOrderListSelect,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapCustomerOrder);
}

/**
 * Create an order from cart line items.
 * Prices and restaurant are derived from the database, never from the client.
 */
export async function createOrder(
  params: CreateOrderParams,
): Promise<CreatedOrder> {
  const quantityByMealId = mergeItemQuantities(params.items);
  const mealIds = [...quantityByMealId.keys()];

  const meals = await prisma.meal.findMany({
    where: { id: { in: mealIds } },
    select: {
      id: true,
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

  if (restaurantIds.size !== 1) {
    throw new CreateOrderError(
      "DIFFERENT_RESTAURANTS",
      "All meals must belong to the same restaurant",
    );
  }

  const restaurantId = meals[0].restaurantId;
  const mealById = new Map(meals.map((meal) => [meal.id, meal]));

  let totalPrice = new Prisma.Decimal(0);
  const orderItems = mealIds.map((mealId) => {
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
      quantity,
      priceAtPurchase: meal.price,
    };
  });

  const paymentMethodMap = {
    CASH: PaymentMethod.CASH,
  } as const;

  return prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        status: OrderStatus.PENDING,
        paymentMethod: paymentMethodMap[params.paymentMethod],
        totalPrice,
        orderAddress: params.deliveryAddress,
        userId: params.userId,
        restaurantId,
        items: {
          create: orderItems,
        },
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
      },
    });
  });
}
