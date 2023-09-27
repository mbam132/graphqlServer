-- CreateEnum
CREATE TYPE "UserAction" AS ENUM ('CREATED', 'DELETED');

-- CreateTable
CREATE TABLE "UserActionsLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "UserAction" NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "UserActionsLog_pkey" PRIMARY KEY ("id")
);
