/*
  Warnings:

  - Added the required column `dateOfRequest` to the `service_requests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "upvotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upvotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "upvotes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dateOfRequest" DATETIME NOT NULL,
    "streetAddress" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "locationText" TEXT NOT NULL,
    "landmark" TEXT,
    "accessInstructions" TEXT,
    "lat" REAL,
    "lng" REAL,
    "contactMethod" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "bestTimeToContact" TEXT,
    "issueType" TEXT,
    "severity" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "hasPermits" BOOLEAN NOT NULL DEFAULT false,
    "affectedServices" TEXT,
    "estimatedValue" REAL,
    "additionalContacts" TEXT,
    "satisfactionRating" INTEGER,
    "formComments" TEXT,
    "agreesToTerms" BOOLEAN NOT NULL DEFAULT true,
    "wantsUpdates" BOOLEAN NOT NULL DEFAULT true,
    "preferredDate" DATETIME,
    "preferredTime" TEXT,
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "departmentId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "slaDueAt" DATETIME,
    "closedAt" DATETIME,
    "reopenUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_requests_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_requests" ("assignedTo", "category", "closedAt", "code", "createdAt", "createdBy", "departmentId", "description", "id", "lat", "lng", "locationText", "priority", "reopenUntil", "slaDueAt", "status", "title", "updatedAt", "version") SELECT "assignedTo", "category", "closedAt", "code", "createdAt", "createdBy", "departmentId", "description", "id", "lat", "lng", "locationText", "priority", "reopenUntil", "slaDueAt", "status", "title", "updatedAt", "version" FROM "service_requests";
DROP TABLE "service_requests";
ALTER TABLE "new_service_requests" RENAME TO "service_requests";
CREATE UNIQUE INDEX "service_requests_code_key" ON "service_requests"("code");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "departmentId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "preferredLanguage" TEXT DEFAULT 'EN',
    "communicationMethod" TEXT DEFAULT 'EMAIL',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "serviceUpdates" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "securityQuestion" TEXT,
    "securityAnswer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "departmentId", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "departmentId", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "upvotes_userId_requestId_key" ON "upvotes"("userId", "requestId");
