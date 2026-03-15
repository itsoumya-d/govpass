-- GovPass: Performance Indexes
-- Migration: 002_performance_indexes

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- applications: user applications by status + date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status_created
  ON public.applications(user_id, status, created_at DESC);

-- scanned_documents: user documents by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scanned_documents_user_created
  ON public.scanned_documents(user_id, created_at DESC);

-- eligibility_results: user eligibility results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_eligibility_results_user_created
  ON public.eligibility_results(user_id, created_at DESC);

-- saved_benefits: user saved benefits
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_benefits_user_created
  ON public.saved_benefits(user_id, created_at DESC);

-- benefit_programs: active programs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benefit_programs_active
  ON public.benefit_programs(created_at DESC) WHERE is_active = TRUE;

-- user_activity_log: user activity trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_user_created
  ON public.user_activity_log(user_id, created_at DESC);
