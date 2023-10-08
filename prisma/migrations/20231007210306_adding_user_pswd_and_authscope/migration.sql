-- CreateEnum
CREATE TYPE "AuthScope" AS ENUM ('SUPERUSER', 'PLAINUSER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authScope" "AuthScope" NOT NULL DEFAULT 'PLAINUSER',
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'password';
