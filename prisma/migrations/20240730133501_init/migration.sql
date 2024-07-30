-- CreateEnum
CREATE TYPE "loginType" AS ENUM ('Kakao', 'Google', 'Apple', 'Guest');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('Regiester', 'Onboarding', 'Delete');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "OverallRating" AS ENUM ('Difficult', 'Disappointing', 'Satisfied', 'Proud');

-- CreateEnum
CREATE TYPE "RepeatDays" AS ENUM ('Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "loginType" "loginType" NOT NULL,
    "memberStatus" "MemberStatus" NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "job" TEXT,
    "challenges" TEXT,
    "gender" "Gender",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "repeatDays" "RepeatDays" NOT NULL,
    "notificationTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubRoutine" (
    "id" SERIAL NOT NULL,
    "routineId" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineReview" (
    "id" SERIAL NOT NULL,
    "routineId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "overallRating" "OverallRating" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubRoutineReview" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "subRoutineId" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "isSkipped" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubRoutineReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" INTEGER NOT NULL,
    "termsAgreement" BOOLEAN NOT NULL DEFAULT false,
    "privacyAgreement" BOOLEAN NOT NULL DEFAULT false,
    "marketingAgreement" BOOLEAN NOT NULL DEFAULT false,
    "eveningNotifications" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubRoutine" ADD CONSTRAINT "SubRoutine_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineReview" ADD CONSTRAINT "RoutineReview_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineReview" ADD CONSTRAINT "RoutineReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubRoutineReview" ADD CONSTRAINT "SubRoutineReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "RoutineReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubRoutineReview" ADD CONSTRAINT "SubRoutineReview_subRoutineId_fkey" FOREIGN KEY ("subRoutineId") REFERENCES "SubRoutine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
