/*
  Warnings:

  - The values [Regiester] on the enum `MemberStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberStatus_new" AS ENUM ('Register', 'Onboarding', 'Delete');
ALTER TABLE "User" ALTER COLUMN "memberStatus" TYPE "MemberStatus_new" USING ("memberStatus"::text::"MemberStatus_new");
ALTER TYPE "MemberStatus" RENAME TO "MemberStatus_old";
ALTER TYPE "MemberStatus_new" RENAME TO "MemberStatus";
DROP TYPE "MemberStatus_old";
COMMIT;
