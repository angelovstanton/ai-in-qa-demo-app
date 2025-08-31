/*
  Warnings:

  - Added the required column `data` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "department_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "department_metrics_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "communicationScore" INTEGER NOT NULL,
    "technicalAccuracyScore" INTEGER NOT NULL,
    "timelinessScore" INTEGER NOT NULL,
    "citizenSatisfactionScore" INTEGER NOT NULL,
    "improvementSuggestions" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "calibrationSession" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quality_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "performancePeriod" TEXT NOT NULL,
    "averageHandlingTime" INTEGER NOT NULL,
    "completedRequests" INTEGER NOT NULL,
    "qualityScore" REAL,
    "citizenSatisfactionRating" REAL,
    "overtimeHours" REAL NOT NULL DEFAULT 0.0,
    "productivityScore" REAL,
    "goalsAchieved" INTEGER NOT NULL DEFAULT 0,
    "goalsMissed" INTEGER NOT NULL DEFAULT 0,
    "trainingHoursCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "staff_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "staff_performance_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workload_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "assignedFrom" TEXT,
    "assignedTo" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignmentReason" TEXT,
    "workloadScore" REAL,
    "estimatedEffort" INTEGER,
    "skillsRequired" TEXT,
    "priorityWeight" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workload_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workload_assignments_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workload_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workload_assignments_assignedFrom_fkey" FOREIGN KEY ("assignedFrom") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" REAL,
    "currentValue" REAL,
    "unit" TEXT,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "performance_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_goals_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_collaborations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "collaborationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "participants" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "completedAt" DATETIME,
    "outcome" TEXT,
    "actionItems" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "team_collaborations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "team_collaborations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_work_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "assignedAgentId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "gpsLat" REAL,
    "gpsLng" REAL,
    "gpsAccuracy" REAL,
    "navigationLink" TEXT,
    "estimatedTravelTime" INTEGER,
    "optimalRoute" TEXT,
    "taskType" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "requiredSkills" TEXT,
    "requiredTools" TEXT,
    "safetyNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "checkInTime" DATETIME,
    "checkOutTime" DATETIME,
    "actualDuration" INTEGER,
    "completionNotes" TEXT,
    "citizenSignature" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "nextVisitScheduled" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "field_work_orders_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_work_orders_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_work_orders_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "photoType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "caption" TEXT,
    "gpsLat" REAL,
    "gpsLng" REAL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "field_photos_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "field_work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_photos_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_time_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "timeType" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "notes" TEXT,
    CONSTRAINT "agent_time_tracking_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "field_work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_time_tracking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentTaskId" TEXT,
    "currentLocation" TEXT,
    "vehicleStatus" TEXT,
    "estimatedAvailableTime" DATETIME,
    "lastUpdateTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_status_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "additional_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT,
    "photoIds" TEXT,
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "additional_issues_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "field_work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "additional_issues_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "part_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "notes" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "part_usage_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "field_work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "part_usage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "requestsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "requestsApproved" INTEGER NOT NULL DEFAULT 0,
    "requestsResolved" INTEGER NOT NULL DEFAULT 0,
    "commentsPosted" INTEGER NOT NULL DEFAULT 0,
    "upvotesReceived" INTEGER NOT NULL DEFAULT 0,
    "upvotesGiven" INTEGER NOT NULL DEFAULT 0,
    "helpfulComments" INTEGER NOT NULL DEFAULT 0,
    "solutionsProvided" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" REAL,
    "participationDays" INTEGER NOT NULL DEFAULT 0,
    "approvalRate" REAL,
    "resolutionRate" REAL,
    "satisfactionScore" REAL,
    "contributionScore" REAL NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "qualityScore" REAL NOT NULL DEFAULT 0,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "previousRank" INTEGER,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 100,
    "metadata" TEXT,
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "requirement" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "community_trends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "change" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_attachments" ("createdAt", "filename", "id", "mime", "requestId", "size", "uploadedById", "url") SELECT "createdAt", "filename", "id", "mime", "requestId", "size", "uploadedById", "url" FROM "attachments";
DROP TABLE "attachments";
ALTER TABLE "new_attachments" RENAME TO "attachments";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "departmentId" TEXT,
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_users" ("alternatePhone", "city", "communicationMethod", "country", "createdAt", "departmentId", "email", "emailNotifications", "firstName", "id", "lastName", "marketingEmails", "name", "passwordHash", "phone", "postalCode", "preferredLanguage", "role", "securityAnswer", "securityQuestion", "serviceUpdates", "smsNotifications", "state", "streetAddress", "twoFactorEnabled", "updatedAt") SELECT "alternatePhone", "city", "communicationMethod", "country", "createdAt", "departmentId", "email", "emailNotifications", "firstName", "id", "lastName", "marketingEmails", "name", "passwordHash", "phone", "postalCode", "preferredLanguage", "role", "securityAnswer", "securityQuestion", "serviceUpdates", "smsNotifications", "state", "streetAddress", "twoFactorEnabled", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "department_metrics_departmentId_metricType_period_periodStart_key" ON "department_metrics"("departmentId", "metricType", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "quality_reviews_requestId_reviewerId_key" ON "quality_reviews"("requestId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_performance_userId_performancePeriod_key" ON "staff_performance"("userId", "performancePeriod");

-- CreateIndex
CREATE UNIQUE INDEX "agent_status_agentId_key" ON "agent_status"("agentId");

-- CreateIndex
CREATE INDEX "community_stats_period_periodStart_idx" ON "community_stats"("period", "periodStart");

-- CreateIndex
CREATE INDEX "community_stats_overallScore_idx" ON "community_stats"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "community_stats_userId_period_periodStart_key" ON "community_stats"("userId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "achievements"("name");

-- CreateIndex
CREATE INDEX "community_trends_category_period_idx" ON "community_trends"("category", "period");

-- CreateIndex
CREATE UNIQUE INDEX "community_trends_category_metric_period_periodStart_key" ON "community_trends"("category", "metric", "period", "periodStart");
