/*
  Warnings:

  - The `repeatDays` column on the `Routine` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Routine" DROP COLUMN "repeatDays",
ADD COLUMN     "repeatDays" BOOLEAN[];
