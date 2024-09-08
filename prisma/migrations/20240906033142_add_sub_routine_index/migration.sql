/*
  Warnings:

  - Added the required column `index` to the `SubRoutine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubRoutine" ADD COLUMN     "index" INTEGER NOT NULL;
