import type { Prisma } from "@prisma/client";

/** Fields safe to return from auth APIs (excludes passwordHash). */
export const userPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  address: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;
