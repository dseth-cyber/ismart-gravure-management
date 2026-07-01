-- CreateTable
CREATE TABLE IF NOT EXISTS auth.scheduled_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'pdf',
    cron TEXT NOT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    params JSONB,
    active BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMPTZ,
    "lastError" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON auth.scheduled_reports(active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_deleted ON auth.scheduled_reports("deletedAt");
