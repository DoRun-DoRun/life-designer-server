/*
  Warnings:

  - Changed the type of `duration` on the `SubRoutine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SubRoutine" DROP COLUMN "duration",
ADD COLUMN     "duration" TIMESTAMP(3) NOT NULL;
