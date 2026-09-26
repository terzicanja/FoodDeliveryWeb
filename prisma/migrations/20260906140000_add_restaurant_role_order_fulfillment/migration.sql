-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';
ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'RESTAURANT';

-- AlterEnum: map legacy CASH values onto CASH_ON_DELIVERY
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH_ON_DELIVERY', 'CARD_ON_DELIVERY', 'CARD');

ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;

ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (
    CASE "paymentMethod"::text
      WHEN 'CASH' THEN 'CASH_ON_DELIVERY'::"PaymentMethod_new"
      WHEN 'CASH_ON_DELIVERY' THEN 'CASH_ON_DELIVERY'::"PaymentMethod_new"
      WHEN 'CARD_ON_DELIVERY' THEN 'CARD_ON_DELIVERY'::"PaymentMethod_new"
      WHEN 'CARD' THEN 'CARD'::"PaymentMethod_new"
      ELSE 'CASH_ON_DELIVERY'::"PaymentMethod_new"
    END
  );

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";

ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH_ON_DELIVERY';

-- Convert estimatedDeliveryTime from absolute timestamp to duration in minutes
ALTER TABLE "Order" ADD COLUMN "estimatedDeliveryTimeMinutes" INTEGER;

UPDATE "Order"
SET "estimatedDeliveryTimeMinutes" = ROUND(
  EXTRACT(EPOCH FROM ("estimatedDeliveryTime" - "createdAt")) / 60.0
)::INTEGER
WHERE "estimatedDeliveryTime" IS NOT NULL
  AND "estimatedDeliveryTime" > "createdAt";

ALTER TABLE "Order" DROP COLUMN "estimatedDeliveryTime";
ALTER TABLE "Order" RENAME COLUMN "estimatedDeliveryTimeMinutes" TO "estimatedDeliveryTime";

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "failureNote" TEXT,
  ADD COLUMN "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY',
  ADD COLUMN "note" TEXT,
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- Existing completed cash orders can be treated as paid
UPDATE "Order"
SET "paymentStatus" = 'PAID'
WHERE "status" = 'DELIVERED';

-- AlterTable
ALTER TABLE "Restaurant"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "ownerId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_ownerId_key" ON "Restaurant"("ownerId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
