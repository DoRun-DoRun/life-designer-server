-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SubRoutine" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
