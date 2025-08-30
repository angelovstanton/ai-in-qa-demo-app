-- Performance Indexes for City Services Portal
-- These indexes optimize common query patterns identified in the codebase analysis

-- Service Requests - Most frequently queried fields
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_department_id ON service_requests(departmentId);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON service_requests(assignedTo);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_by ON service_requests(createdBy);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_priority ON service_requests(status, priority);

-- Users - Optimize authentication and role-based queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(departmentId);
CREATE INDEX IF NOT EXISTS idx_users_role_department ON users(role, departmentId);

-- Quality Reviews - Supervisor dashboard queries
CREATE INDEX IF NOT EXISTS idx_quality_reviews_reviewer_id ON quality_reviews(reviewerId);
CREATE INDEX IF NOT EXISTS idx_quality_reviews_created_at ON quality_reviews(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_quality_reviews_request_id ON quality_reviews(requestId);

-- Staff Performance - Performance metrics queries
CREATE INDEX IF NOT EXISTS idx_staff_performance_user_period ON staff_performance(userId, performancePeriod);
CREATE INDEX IF NOT EXISTS idx_staff_performance_department ON staff_performance(departmentId);

-- Workload Assignments - Workload balancing queries
CREATE INDEX IF NOT EXISTS idx_workload_assignments_assigned_to ON workload_assignments(assignedTo);
CREATE INDEX IF NOT EXISTS idx_workload_assignments_active ON workload_assignments(isActive);
CREATE INDEX IF NOT EXISTS idx_workload_assignments_created_at ON workload_assignments(createdAt DESC);

-- Field Work Orders - Field agent queries
CREATE INDEX IF NOT EXISTS idx_field_work_orders_agent ON field_work_orders(assignedAgentId);
CREATE INDEX IF NOT EXISTS idx_field_work_orders_status ON field_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_field_work_orders_priority ON field_work_orders(priority);

-- Department Metrics - Analytics queries
CREATE INDEX IF NOT EXISTS idx_department_metrics_composite ON department_metrics(departmentId, metricType, period, periodStart);

-- Comments - Request detail queries
CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(requestId);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(createdAt DESC);

-- Event Logs - Audit trail queries
CREATE INDEX IF NOT EXISTS idx_event_logs_request_id ON event_logs(requestId);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(createdAt DESC);