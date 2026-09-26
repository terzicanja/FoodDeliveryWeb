import { RestaurantType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import type { JwtPayload } from "@/lib/auth";
import { getAuthPayload } from "@/lib/auth-request";
import { prisma } from "@/lib/prisma";

export type OwnedRestaurant = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  imageUrl: string | null;
  restaurantTypes: RestaurantType[];
};

type RestaurantOwnerSuccess = {
  ok: true;
  auth: JwtPayload;
  restaurant: OwnedRestaurant;
};

type RestaurantOwnerFailure = {
  ok: false;
  response: NextResponse;
};

/**
 * Require RESTAURANT role and load the restaurant owned by that user.
 * Returns 401 / 403 / 404 (no owned restaurant) as appropriate.
 */
export async function requireRestaurantOwner(): Promise<
  RestaurantOwnerSuccess | RestaurantOwnerFailure
> {
  const auth = await getAuthPayload();

  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (auth.role !== Role.RESTAURANT) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Restaurant access required" },
        { status: 403 },
      ),
    };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: auth.userId },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      imageUrl: true,
      restaurantTypes: true,
    },
  });

  if (!restaurant) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No restaurant is associated with this account" },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    auth,
    restaurant,
  };
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
