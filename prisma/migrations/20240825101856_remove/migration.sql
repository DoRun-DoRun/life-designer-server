/*
  Warnings:

  - Changed the type of `repeatDays` on the `Routine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Routine" DROP COLUMN "repeatDays",
ADD COLUMN     "repeatDays" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RepeatDays";
