/*
  Warnings:

  - You are about to drop the column `gamificationEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rewardsBalance` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "image" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "organizationId" TEXT,
    "canReconcile" BOOLEAN NOT NULL DEFAULT false,
    "dashboardLayout" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "payoutDay" INTEGER DEFAULT 15,
    "monthlyLimit" INTEGER DEFAULT 500000,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "phoneNumber" TEXT,
    "preferences" TEXT DEFAULT '{}',
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "encryptedDataKey" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "bio", "canReconcile", "createdAt", "dashboardLayout", "email", "emailVerified", "encryptedDataKey", "id", "image", "monthlyLimit", "name", "organizationId", "password", "payoutDay", "phoneNumber", "preferences", "resetToken", "resetTokenExpiry", "role", "status", "updatedAt") SELECT "avatarUrl", "bio", "canReconcile", "createdAt", "dashboardLayout", "email", "emailVerified", "encryptedDataKey", "id", "image", "monthlyLimit", "name", "organizationId", "password", "payoutDay", "phoneNumber", "preferences", "resetToken", "resetTokenExpiry", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
