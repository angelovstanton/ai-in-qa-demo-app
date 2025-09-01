-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "departmentId" TEXT,
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmationToken" TEXT,
    "emailConfirmationExpires" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "statusChangedAt" DATETIME,
    "statusChangeReason" TEXT,
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
INSERT INTO "new_users" ("alternatePhone", "city", "communicationMethod", "country", "createdAt", "departmentId", "email", "emailConfirmationToken", "emailConfirmed", "emailNotifications", "firstName", "id", "isActive", "lastName", "marketingEmails", "name", "passwordHash", "passwordResetExpires", "passwordResetToken", "phone", "postalCode", "preferredLanguage", "role", "securityAnswer", "securityQuestion", "serviceUpdates", "smsNotifications", "state", "streetAddress", "twoFactorEnabled", "updatedAt") SELECT "alternatePhone", "city", "communicationMethod", "country", "createdAt", "departmentId", "email", "emailConfirmationToken", "emailConfirmed", "emailNotifications", "firstName", "id", "isActive", "lastName", "marketingEmails", "name", "passwordHash", "passwordResetExpires", "passwordResetToken", "phone", "postalCode", "preferredLanguage", "role", "securityAnswer", "securityQuestion", "serviceUpdates", "smsNotifications", "state", "streetAddress", "twoFactorEnabled", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
