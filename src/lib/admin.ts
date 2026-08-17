import { Prisma, type RestaurantType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateMealInput,
  CreateRestaurantInput,
} from "@/lib/validations/admin";

export type AdminErrorCode = "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST";

export class AdminActionError extends Error {
  readonly code: AdminErrorCode;
  readonly status: 400 | 404 | 409;

  constructor(code: AdminErrorCode, message: string) {
    super(message);
    this.name = "AdminActionError";
    this.code = code;
    this.status = code === "NOT_FOUND" ? 404 : code === "CONFLICT" ? 409 : 400;
  }
}

export function parsePositiveId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

const adminUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  address: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AdminUser = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}> & {
  isSelf: boolean;
  customerOrderCount: number;
  reviewCount: number;
  courierOrderCount: number;
};

export type AdminRestaurant = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  restaurantTypes: RestaurantType[];
  createdAt: Date;
  mealCount: number;
  orderCount: number;
};

export type AdminMeal = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  restaurantId: number;
  orderItemCount: number;
  reviewCount: number;
};

function serializeMeal(
  meal: {
    id: number;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    images: string[];
    restaurantId: number;
    _count: { orderItems: number; reviews: number };
  },
): AdminMeal {
  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
    price: meal.price.toFixed(2),
    images: meal.images,
    restaurantId: meal.restaurantId,
    orderItemCount: meal._count.orderItems,
    reviewCount: meal._count.reviews,
  };
}

export async function getUsersForAdmin(adminUserId: number): Promise<AdminUser[]> {
  const users = await prisma.user.findMany({
    select: {
      ...adminUserSelect,
      _count: {
        select: {
          orders: true,
          reviews: true,
          courierOrders: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    address: user.address,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    isSelf: user.id === adminUserId,
    customerOrderCount: user._count.orders,
    reviewCount: user._count.reviews,
    courierOrderCount: user._count.courierOrders,
  }));
}

export async function deleteUserForAdmin(params: {
  userId: number;
  adminUserId: number;
}): Promise<void> {
  const { userId, adminUserId } = params;

  if (userId === adminUserId) {
    throw new AdminActionError(
      "BAD_REQUEST",
      "You cannot delete your own account.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          courierOrders: true,
        },
      },
    },
  });

  if (!user) {
    throw new AdminActionError("NOT_FOUND", "User not found.");
  }

  const blockers: string[] = [];

  if (user._count.orders > 0) {
    blockers.push("orders");
  }

  if (user._count.reviews > 0) {
    blockers.push("reviews");
  }

  if (user._count.courierOrders > 0) {
    blockers.push("courier assignments");
  }

  if (blockers.length > 0) {
    throw new AdminActionError(
      "CONFLICT",
      `This user cannot be deleted while related ${blockers.join(", ")} exist.`,
    );
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function getRestaurantsForAdmin(): Promise<AdminRestaurant[]> {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      restaurantTypes: true,
      createdAt: true,
      _count: {
        select: {
          meals: true,
          orders: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return restaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    restaurantTypes: restaurant.restaurantTypes,
    createdAt: restaurant.createdAt,
    mealCount: restaurant._count.meals,
    orderCount: restaurant._count.orders,
  }));
}

export async function createRestaurantForAdmin(
  input: CreateRestaurantInput,
): Promise<AdminRestaurant> {
  const restaurant = await prisma.restaurant.create({
    data: {
      name: input.name,
      description: input.description,
      address: input.address,
      restaurantTypes: input.restaurantTypes,
    },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      restaurantTypes: true,
      createdAt: true,
    },
  });

  return {
    ...restaurant,
    mealCount: 0,
    orderCount: 0,
  };
}

export async function deleteRestaurantForAdmin(restaurantId: number): Promise<void> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      _count: {
        select: {
          meals: true,
          orders: true,
        },
      },
    },
  });

  if (!restaurant) {
    throw new AdminActionError("NOT_FOUND", "Restaurant not found.");
  }

  const blockers: string[] = [];

  if (restaurant._count.meals > 0) {
    blockers.push("meals");
  }

  if (restaurant._count.orders > 0) {
    blockers.push("orders");
  }

  if (blockers.length > 0) {
    throw new AdminActionError(
      "CONFLICT",
      `This restaurant cannot be deleted while related ${blockers.join(", ")} exist.`,
    );
  }

  await prisma.restaurant.delete({ where: { id: restaurantId } });
}

export async function getMealsForRestaurantAdmin(
  restaurantId: number,
): Promise<AdminMeal[]> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });

  if (!restaurant) {
    throw new AdminActionError("NOT_FOUND", "Restaurant not found.");
  }

  const meals = await prisma.meal.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      restaurantId: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return meals.map(serializeMeal);
}

export async function createMealForRestaurantAdmin(params: {
  restaurantId: number;
  input: CreateMealInput;
}): Promise<AdminMeal> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
    select: { id: true },
  });

  if (!restaurant) {
    throw new AdminActionError("NOT_FOUND", "Restaurant not found.");
  }

  const meal = await prisma.meal.create({
    data: {
      name: params.input.name,
      description: params.input.description,
      price: new Prisma.Decimal(params.input.price.toFixed(2)),
      images: params.input.images,
      restaurantId: params.restaurantId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      restaurantId: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
  });

  return serializeMeal(meal);
}

export async function deleteMealForAdmin(mealId: number): Promise<void> {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
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
    throw new AdminActionError("NOT_FOUND", "Meal not found.");
  }

  const blockers: string[] = [];

  if (meal._count.orderItems > 0) {
    blockers.push("order items");
  }

  if (meal._count.reviews > 0) {
    blockers.push("reviews");
  }

  if (blockers.length > 0) {
    throw new AdminActionError(
      "CONFLICT",
      `This meal cannot be deleted while related ${blockers.join(", ")} exist.`,
    );
  }

  await prisma.meal.delete({ where: { id: mealId } });
}
