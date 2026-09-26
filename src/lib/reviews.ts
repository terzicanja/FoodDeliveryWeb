import { Prisma } from "@prisma/client";
import { REVIEWABLE_ORDER_STATUSES } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import type { CreateReviewInput } from "@/lib/validations/reviews";

export type RatingSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export const EMPTY_RATING_SUMMARY: RatingSummary = {
  averageRating: null,
  reviewCount: 0,
};

export type PublicReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  mealId: number;
  reviewer: {
    firstName: string;
  };
};

export type OwnReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export type MealReviewEligibility = {
  canReview: boolean;
  ownReview: OwnReview | null;
};

export type CreateReviewErrorCode =
  | "MEAL_NOT_FOUND"
  | "NOT_ELIGIBLE"
  | "ALREADY_REVIEWED";

export class CreateReviewError extends Error {
  readonly code: CreateReviewErrorCode;

  constructor(code: CreateReviewErrorCode, message: string) {
    super(message);
    this.name = "CreateReviewError";
    this.code = code;
  }
}

const publicReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  mealId: true,
  user: {
    select: {
      firstName: true,
    },
  },
} satisfies Prisma.ReviewSelect;

type PublicReviewRecord = Prisma.ReviewGetPayload<{
  select: typeof publicReviewSelect;
}>;

function roundAverage(value: number): number {
  return Math.round(value * 10) / 10;
}

function toRatingSummary(
  average: number | null,
  count: number,
): RatingSummary {
  if (count === 0 || average == null) {
    return EMPTY_RATING_SUMMARY;
  }

  return {
    averageRating: roundAverage(average),
    reviewCount: count,
  };
}

function mapPublicReview(review: PublicReviewRecord): PublicReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    mealId: review.mealId,
    reviewer: {
      firstName: review.user.firstName,
    },
  };
}

async function mealExists(mealId: number): Promise<boolean> {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    select: { id: true },
  });

  return meal !== null;
}

async function findCompletedPurchase(userId: number, mealId: number) {
  return prisma.orderItem.findFirst({
    where: {
      mealId,
      order: {
        userId,
        status: { in: [...REVIEWABLE_ORDER_STATUSES] },
      },
    },
    select: { id: true },
  });
}

async function userHasAnyPurchase(userId: number, mealId: number) {
  return prisma.orderItem.findFirst({
    where: {
      mealId,
      order: { userId },
    },
    select: { id: true },
  });
}

/**
 * Average of every review on this meal. `averageRating` is null when there are none.
 */
export async function getMealRating(mealId: number): Promise<RatingSummary> {
  const aggregate = await prisma.review.aggregate({
    where: { mealId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return toRatingSummary(aggregate._avg.rating, aggregate._count._all);
}

/**
 * Restaurant rating is the unweighted average of all meal reviews.
 * Each review counts once; meal averages are not averaged together.
 */
export async function getRestaurantRating(
  restaurantId: number,
): Promise<RatingSummary> {
  const aggregate = await prisma.review.aggregate({
    where: { meal: { restaurantId } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return toRatingSummary(aggregate._avg.rating, aggregate._count._all);
}

/**
 * Batch restaurant ratings for listing views / future sorting.
 */
export async function getRestaurantRatings(
  restaurantIds: number[],
): Promise<Map<number, RatingSummary>> {
  const summaries = new Map<number, RatingSummary>();

  for (const restaurantId of restaurantIds) {
    summaries.set(restaurantId, EMPTY_RATING_SUMMARY);
  }

  if (restaurantIds.length === 0) {
    return summaries;
  }

  const reviews = await prisma.review.findMany({
    where: { meal: { restaurantId: { in: restaurantIds } } },
    select: {
      rating: true,
      meal: {
        select: { restaurantId: true },
      },
    },
  });

  const totals = new Map<number, { sum: number; count: number }>();

  for (const review of reviews) {
    const restaurantId = review.meal.restaurantId;
    const current = totals.get(restaurantId) ?? { sum: 0, count: 0 };
    current.sum += review.rating;
    current.count += 1;
    totals.set(restaurantId, current);
  }

  for (const [restaurantId, total] of totals) {
    summaries.set(
      restaurantId,
      toRatingSummary(total.sum / total.count, total.count),
    );
  }

  return summaries;
}

/**
 * One grouped query for all meals on a restaurant page (avoids N+1).
 */
export async function getMealRatingSummaries(
  mealIds: number[],
): Promise<Map<number, RatingSummary>> {
  const summaries = new Map<number, RatingSummary>();

  for (const mealId of mealIds) {
    summaries.set(mealId, EMPTY_RATING_SUMMARY);
  }

  if (mealIds.length === 0) {
    return summaries;
  }

  const grouped = await prisma.review.groupBy({
    by: ["mealId"],
    where: { mealId: { in: mealIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const row of grouped) {
    summaries.set(row.mealId, toRatingSummary(row._avg.rating, row._count._all));
  }

  return summaries;
}

export async function getReviewsForMeal(mealId: number): Promise<PublicReview[]> {
  const reviews = await prisma.review.findMany({
    where: { mealId },
    select: publicReviewSelect,
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(mapPublicReview);
}

export async function getReviewsForMeals(
  mealIds: number[],
): Promise<Map<number, PublicReview[]>> {
  const byMeal = new Map<number, PublicReview[]>();

  for (const mealId of mealIds) {
    byMeal.set(mealId, []);
  }

  if (mealIds.length === 0) {
    return byMeal;
  }

  const reviews = await prisma.review.findMany({
    where: { mealId: { in: mealIds } },
    select: publicReviewSelect,
    orderBy: { createdAt: "desc" },
  });

  for (const review of reviews) {
    const list = byMeal.get(review.mealId) ?? [];
    list.push(mapPublicReview(review));
    byMeal.set(review.mealId, list);
  }

  return byMeal;
}

export async function getMealReviewsPayload(mealId: number): Promise<{
  rating: RatingSummary;
  reviews: PublicReview[];
} | null> {
  if (!(await mealExists(mealId))) {
    return null;
  }

  const [rating, reviews] = await Promise.all([
    getMealRating(mealId),
    getReviewsForMeal(mealId),
  ]);

  return { rating, reviews };
}

export async function getReviewEligibilityForUser(
  userId: number,
  mealIds: number[],
): Promise<Map<number, MealReviewEligibility>> {
  const eligibility = new Map<number, MealReviewEligibility>();

  for (const mealId of mealIds) {
    eligibility.set(mealId, { canReview: false, ownReview: null });
  }

  if (mealIds.length === 0) {
    return eligibility;
  }

  const [completedItems, ownReviews] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        mealId: { in: mealIds },
        order: {
          userId,
          status: { in: [...REVIEWABLE_ORDER_STATUSES] },
        },
      },
      select: { mealId: true },
      distinct: ["mealId"],
    }),
    prisma.review.findMany({
      where: {
        userId,
        mealId: { in: mealIds },
      },
      select: {
        id: true,
        mealId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    }),
  ]);

  const completedMealIds = new Set(completedItems.map((item) => item.mealId));

  for (const review of ownReviews) {
    const current = eligibility.get(review.mealId) ?? {
      canReview: false,
      ownReview: null,
    };
    current.ownReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
    eligibility.set(review.mealId, current);
  }

  for (const mealId of completedMealIds) {
    const current = eligibility.get(mealId) ?? {
      canReview: false,
      ownReview: null,
    };
    current.canReview = current.ownReview === null;
    eligibility.set(mealId, current);
  }

  return eligibility;
}

export async function createReview(params: {
  userId: number;
  input: CreateReviewInput;
}): Promise<PublicReview> {
  const { userId, input } = params;

  if (!(await mealExists(input.mealId))) {
    throw new CreateReviewError("MEAL_NOT_FOUND", "Meal not found");
  }

  const completedPurchase = await findCompletedPurchase(userId, input.mealId);

  if (!completedPurchase) {
    const anyPurchase = await userHasAnyPurchase(userId, input.mealId);

    throw new CreateReviewError(
      "NOT_ELIGIBLE",
      anyPurchase
        ? "You can review this meal after the order has been completed"
        : "You can only review meals you have ordered",
    );
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_mealId: {
        userId,
        mealId: input.mealId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new CreateReviewError(
      "ALREADY_REVIEWED",
      "You have already reviewed this meal",
    );
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        mealId: input.mealId,
        rating: input.rating,
        comment: input.comment,
      },
      select: publicReviewSelect,
    });

    return mapPublicReview(review);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CreateReviewError(
        "ALREADY_REVIEWED",
        "You have already reviewed this meal",
      );
    }

    throw error;
  }
}
