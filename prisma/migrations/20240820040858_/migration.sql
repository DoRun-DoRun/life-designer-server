/*
  Warnings:

  - You are about to drop the column `loginType` on the `User` table. All the data in the column will be lost.
  - Added the required column `authProvider` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('Kakao', 'Google', 'Apple', 'Guest');

-- DropForeignKey
ALTER TABLE "RoutineReview" DROP CONSTRAINT "RoutineReview_routineId_fkey";

-- DropForeignKey
ALTER TABLE "SubRoutine" DROP CONSTRAINT "SubRoutine_routineId_fkey";

-- DropForeignKey
ALTER TABLE "SubRoutineReview" DROP CONSTRAINT "SubRoutineReview_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "SubRoutineReview" DROP CONSTRAINT "SubRoutineReview_subRoutineId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "loginType",
ADD COLUMN     "authProvider" "AuthProvider" NOT NULL;

-- DropEnum
DROP TYPE "loginType";

-- AddForeignKey
ALTER TABLE "SubRoutine" ADD CONSTRAINT "SubRoutine_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineReview" ADD CONSTRAINT "RoutineReview_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubRoutineReview" ADD CONSTRAINT "SubRoutineReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "RoutineReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubRoutineReview" ADD CONSTRAINT "SubRoutineReview_subRoutineId_fkey" FOREIGN KEY ("subRoutineId") REFERENCES "SubRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
