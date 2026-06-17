-- Migration: Make audit_logs table append-only (immutable)
-- This prevents tampering with audit records via UPDATE or DELETE

-- 1. Create a trigger function that rejects UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION audit.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Audit logs are immutable: UPDATE is not permitted on audit.audit_logs';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs are immutable: DELETE is not permitted on audit.audit_logs';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply the trigger to the audit_logs table
DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON audit.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
  BEFORE UPDATE OR DELETE ON audit.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit.prevent_audit_log_mutation();

-- 3. Add a comment for documentation
COMMENT ON TRIGGER trg_prevent_audit_log_mutation ON audit.audit_logs IS 'Prevents UPDATE/DELETE to enforce audit log immutability';

-- 4. Verify it works (test INSERT still allowed)
-- INSERT INTO audit.audit_logs (action, details, created_at) VALUES ('test.immutability', 'Testing append-only constraint', NOW());
-- Should fail: UPDATE audit.audit_logs SET details = 'tampered' WHERE action = 'test.immutability';
-- Should fail: DELETE FROM audit.audit_logs WHERE action = 'test.immutability';
-- Cleanup: DELETE FROM audit.audit_logs WHERE action = 'test.immutability'; -- this will fail, use TRUNCATE with admin rights
