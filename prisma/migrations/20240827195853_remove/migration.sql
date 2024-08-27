/*
  Warnings:

  - You are about to drop the column `reviewDate` on the `RoutineReview` table. All the data in the column will be lost.
  - Made the column `emoji` on table `SubRoutine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RoutineReview" DROP COLUMN "reviewDate";

-- AlterTable
ALTER TABLE "SubRoutine" ALTER COLUMN "emoji" SET NOT NULL;
