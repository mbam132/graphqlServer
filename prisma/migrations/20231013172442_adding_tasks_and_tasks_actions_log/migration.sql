/*
  Warnings:

  - You are about to drop the column `listId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `minutesEstimate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `TodoList` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userEmail` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskAction" AS ENUM ('CREATED', 'CHANGED_STATUS', 'DELETED');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_listId_fkey";

-- DropForeignKey
ALTER TABLE "TodoList" DROP CONSTRAINT "TodoList_userEmail_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "listId",
DROP COLUMN "minutesEstimate",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userEmail" TEXT NOT NULL;

-- DropTable
DROP TABLE "TodoList";

-- CreateTable
CREATE TABLE "TaskActionsLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "TaskAction" NOT NULL,

    CONSTRAINT "TaskActionsLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
