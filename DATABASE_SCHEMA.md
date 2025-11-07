# 🗄️ مخطط قاعدة البيانات (Database Schema)

## نظرة عامة

يستخدم النظام PostgreSQL مع Prisma ORM لإدارة قاعدة البيانات.

## 📋 الجداول (Tables)

### 1. Users (المستخدمون)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'supervisor', 'employee', 'auditor')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  last_login_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### 2. Companies (الشركات)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_arabic VARCHAR(255),
  description TEXT,
  company_type VARCHAR(50) CHECK (company_type IN ('individual', 'partnership', 'llc', 'public_company', 'private_company', 'non_profit')),
  commercial_registration VARCHAR(100) UNIQUE,
  tax_number VARCHAR(100),
  establishment_date DATE,
  
  -- Address
  country VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  street VARCHAR(255),
  building_number VARCHAR(50),
  postal_code VARCHAR(20),
  
  -- Contact
  primary_email VARCHAR(255),
  primary_phone VARCHAR(20),
  secondary_phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('ready', 'in_progress', 'on_hold', 'archived')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Metadata
  notes TEXT,
  tags TEXT[], -- Array of tags
  custom_fields JSONB, -- For flexible custom data
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_cr ON companies(commercial_registration);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_tags ON companies USING GIN(tags);
CREATE INDEX idx_companies_custom_fields ON companies USING GIN(custom_fields);

-- Full-text search
CREATE INDEX idx_companies_search ON companies USING GIN(
  to_tsvector('arabic', 
    COALESCE(name, '') || ' ' || 
    COALESCE(name_arabic, '') || ' ' || 
    COALESCE(description, '')
  )
);
```

### 3. Documents (الوثائق)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- File Information
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  extension VARCHAR(10),
  
  -- Categorization
  category VARCHAR(50) CHECK (category IN ('legal', 'financial', 'hr', 'government', 'contract', 'report', 'other')),
  document_type VARCHAR(100),
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  is_latest_version BOOLEAN DEFAULT TRUE,
  
  -- Status & Approval
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Expiry
  issue_date DATE,
  expiry_date DATE,
  expiry_notified BOOLEAN DEFAULT FALSE,
  
  -- Security
  access_level VARCHAR(30) DEFAULT 'private' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
  checksum VARCHAR(64), -- SHA-256
  encrypted BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  custom_metadata JSONB,
  
  -- OCR & Content
  ocr_text TEXT,
  ocr_processed BOOLEAN DEFAULT FALSE,
  
  -- Storage
  storage_provider VARCHAR(50) DEFAULT 'minio',
  storage_bucket VARCHAR(100),
  storage_key TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Audit
  uploaded_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_documents_version ON documents(parent_document_id, version);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Full-text search on OCR content
CREATE INDEX idx_documents_ocr_search ON documents USING GIN(to_tsvector('arabic', COALESCE(ocr_text, '')));
```

### 4. Company Shares (مشاركات الشركات)

```sql
CREATE TABLE company_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Permission Level
  permission_level VARCHAR(30) NOT NULL CHECK (permission_level IN ('view', 'edit', 'manage')),
  
  -- Time-based Access
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  
  -- Notifications
  notified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  note TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(company_id, shared_with_user_id)
);

-- Indexes
CREATE INDEX idx_shares_company ON company_shares(company_id);
CREATE INDEX idx_shares_user ON company_shares(shared_with_user_id);
CREATE INDEX idx_shares_status ON company_shares(status);
CREATE INDEX idx_shares_expiry ON company_shares(valid_until) WHERE valid_until IS NOT NULL;
```

### 5. Access Requests (طلبات الوصول)

```sql
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  
  -- Request Details
  permission_level VARCHAR(30) NOT NULL CHECK (permission_level IN ('view', 'edit', 'manage')),
  reason TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Response
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  response_note TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_access_requests_company ON access_requests(company_id);
CREATE INDEX idx_access_requests_user ON access_requests(requested_by);
CREATE INDEX idx_access_requests_status ON access_requests(status);
```

### 6. Comments (التعليقات)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Comment can be on company or document
  commentable_type VARCHAR(20) NOT NULL CHECK (commentable_type IN ('company', 'document')),
  commentable_id UUID NOT NULL,
  
  -- Comment Details
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- Status
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Mentions
  mentioned_users UUID[],
  
  -- Attachments
  attachments JSONB, -- Array of attachment info
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_by ON comments(created_by);
CREATE INDEX idx_comments_resolved ON comments(resolved);
```

### 7. Notifications (الإشعارات)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50), -- e.g., 'company', 'document', 'share'
  reference_id UUID,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Delivery
  sent_email BOOLEAN DEFAULT FALSE,
  sent_sms BOOLEAN DEFAULT FALSE,
  sent_push BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 8. Audit Logs (سجلات التدقيق)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Action
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  
  -- Resource
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- Request Info
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'error')),
  
  -- Details
  details JSONB,
  
  -- Changes (for updates)
  old_values JSONB,
  new_values JSONB,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_status ON audit_logs(status);

-- Partitioning by month (for performance)
-- This table should be partitioned for better performance with large data
```

### 9. Company Templates (قوالب الشركات)

```sql
CREATE TABLE company_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_type VARCHAR(50),
  
  -- Required Documents
  required_documents JSONB NOT NULL, -- Array of document types with details
  
  -- Custom Fields
  custom_fields_schema JSONB, -- JSON Schema for custom fields
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_templates_type ON company_templates(company_type);
CREATE INDEX idx_templates_active ON company_templates(is_active);
```

### 10. Document Templates (قوالب الوثائق)

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  -- Template File
  template_file_path TEXT,
  
  -- Fields
  fields_schema JSONB, -- JSON Schema for fields in the template
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_doc_templates_category ON document_templates(category);
CREATE INDEX idx_doc_templates_active ON document_templates(is_active);
```

### 11. Workflows (سير العمل)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type VARCHAR(50) NOT NULL, -- e.g., 'document_uploaded', 'company_created'
  trigger_config JSONB,
  
  -- Actions
  actions JSONB NOT NULL, -- Array of actions to execute
  
  -- Conditions
  conditions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_workflows_trigger ON workflows(trigger_type);
CREATE INDEX idx_workflows_active ON workflows(is_active);
```

### 12. Workflow Executions (تنفيذات سير العمل)

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  -- Trigger Info
  triggered_by VARCHAR(50),
  trigger_data JSONB,
  
  -- Execution
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Results
  executed_actions JSONB,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workflow_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_exec_status ON workflow_executions(status);
CREATE INDEX idx_workflow_exec_created ON workflow_executions(created_at DESC);
```

### 13. Sessions (الجلسات)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  
  -- Device Info
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_name VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_active ON sessions(is_active);

-- Auto cleanup expired sessions
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE is_active = TRUE;
```

### 14. Settings (الإعدادات)

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);
```

### 15. Reports (التقارير)

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Parameters
  parameters JSONB,
  
  -- Schedule
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100), -- Cron expression
  
  -- Recipients
  recipients UUID[], -- Array of user IDs
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_scheduled ON reports(is_scheduled) WHERE is_active = TRUE;
CREATE INDEX idx_reports_created_by ON reports(created_by);
```

### 16. Report Generations (إنشاءات التقارير)

```sql
CREATE TABLE report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  
  -- File
  file_path TEXT,
  file_size BIGINT,
  file_format VARCHAR(20),
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_report_gen_report ON report_generations(report_id);
CREATE INDEX idx_report_gen_status ON report_generations(status);
CREATE INDEX idx_report_gen_created ON report_generations(started_at DESC);
```

## 🔗 العلاقات (Relationships)

```
Users (1) ──< (N) Companies [owner]
Users (1) ──< (N) Documents [uploader]
Companies (1) ──< (N) Documents
Companies (1) ──< (N) Company_Shares
Users (1) ──< (N) Company_Shares [shared_with]
Users (1) ──< (N) Comments
Documents (1) ──< (N) Documents [versions]
Comments (1) ──< (N) Comments [replies]
Users (1) ──< (N) Notifications
Users (1) ──< (N) Audit_Logs
Workflows (1) ──< (N) Workflow_Executions
Reports (1) ──< (N) Report_Generations
```

## 🎯 الإجراءات المخزنة (Stored Procedures)

### 1. حساب نسبة اكتمال الشركة

```sql
CREATE OR REPLACE FUNCTION calculate_company_completion(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  total_uploaded INTEGER;
  completion INTEGER;
BEGIN
  -- Get required documents count from template
  SELECT COUNT(*) INTO total_required
  FROM jsonb_array_elements(
    (SELECT required_documents 
     FROM company_templates 
     WHERE company_type = (SELECT company_type FROM companies WHERE id = company_uuid))
  );
  
  -- Get uploaded approved documents count
  SELECT COUNT(*) INTO total_uploaded
  FROM documents
  WHERE company_id = company_uuid 
    AND status = 'approved'
    AND is_latest_version = TRUE;
  
  -- Calculate percentage
  IF total_required > 0 THEN
    completion := (total_uploaded * 100) / total_required;
  ELSE
    completion := 0;
  END IF;
  
  -- Update company
  UPDATE companies 
  SET completion_percentage = completion,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = company_uuid;
  
  RETURN completion;
END;
$$ LANGUAGE plpgsql;
```

### 2. تنظيف الجلسات المنتهية

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### 3. إرسال إشعار انتهاء الوثيقة

```sql
CREATE OR REPLACE FUNCTION notify_expiring_documents()
RETURNS INTEGER AS $$
DECLARE
  doc RECORD;
  notification_count INTEGER := 0;
BEGIN
  FOR doc IN 
    SELECT d.*, c.name as company_name, c.owner_id
    FROM documents d
    JOIN companies c ON d.company_id = c.id
    WHERE d.expiry_date IS NOT NULL
      AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      AND d.expiry_date > CURRENT_DATE
      AND d.expiry_notified = FALSE
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message, 
      reference_type, reference_id, data
    ) VALUES (
      doc.owner_id,
      'document_expiring',
      'وثيقة على وشك الانتهاء',
      format('الوثيقة "%s" في شركة "%s" ستنتهي في %s', 
        doc.name, doc.company_name, doc.expiry_date),
      'document',
      doc.id,
      jsonb_build_object(
        'document_id', doc.id,
        'company_id', doc.company_id,
        'expiry_date', doc.expiry_date
      )
    );
    
    UPDATE documents 
    SET expiry_notified = TRUE 
    WHERE id = doc.id;
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;
```

## ⚡ المحفزات (Triggers)

### 1. تحديث updated_at تلقائياً

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to other tables)
```

### 2. تسجيل الإجراءات في audit_logs

```sql
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id,
      status, old_values
    ) VALUES (
      COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NULL),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      'success',
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id,
      status, old_values, new_values
    ) VALUES (
      COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NULL),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      'success',
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id,
      status, new_values
    ) VALUES (
      COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NULL),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      'success',
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to important tables
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_company_shares AFTER INSERT OR UPDATE OR DELETE ON company_shares
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

### 3. حساب نسبة الاكتمال تلقائياً

```sql
CREATE OR REPLACE FUNCTION auto_calculate_completion()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_company_completion(NEW.company_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_completion_trigger 
AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_completion();
```

## 📊 الـ Views المفيدة

### 1. Company Overview

```sql
CREATE VIEW vw_company_overview AS
SELECT 
  c.id,
  c.name,
  c.status,
  c.completion_percentage,
  c.owner_id,
  u.first_name || ' ' || u.last_name as owner_name,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'approved') as approved_documents,
  COUNT(DISTINCT d.id) FILTER (WHERE d.expiry_date < CURRENT_DATE) as expired_documents,
  COUNT(DISTINCT cs.id) as shared_with_count,
  c.created_at,
  c.updated_at
FROM companies c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN documents d ON c.id = d.company_id AND d.is_latest_version = TRUE
LEFT JOIN company_shares cs ON c.id = cs.company_id AND cs.status = 'active'
GROUP BY c.id, u.first_name, u.last_name;
```

### 2. User Activity

```sql
CREATE VIEW vw_user_activity AS
SELECT 
  u.id,
  u.first_name || ' ' || u.last_name as full_name,
  u.role,
  COUNT(DISTINCT c.id) as companies_owned,
  COUNT(DISTINCT d.id) as documents_uploaded,
  COUNT(DISTINCT com.id) as comments_made,
  MAX(al.created_at) as last_activity
FROM users u
LEFT JOIN companies c ON u.id = c.owner_id
LEFT JOIN documents d ON u.id = d.uploaded_by
LEFT JOIN comments com ON u.id = com.created_by
LEFT JOIN audit_logs al ON u.id = al.user_id
GROUP BY u.id;
```

### 3. Expiring Documents Alert

```sql
CREATE VIEW vw_expiring_documents AS
SELECT 
  d.id as document_id,
  d.name as document_name,
  d.expiry_date,
  d.expiry_date - CURRENT_DATE as days_remaining,
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  u.email as owner_email
FROM documents d
JOIN companies c ON d.company_id = c.id
JOIN users u ON c.owner_id = u.id
WHERE d.expiry_date IS NOT NULL
  AND d.expiry_date > CURRENT_DATE
  AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY d.expiry_date ASC;
```

## 🔧 الصيانة والتحسين

### تقسيم الجداول (Partitioning)

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add more partitions as needed
```

### مهام الصيانة الدورية

```sql
-- 1. تنظيف الجلسات المنتهية (يومياً)
SELECT cleanup_expired_sessions();

-- 2. إرسال إشعارات الوثائق المنتهية (يومياً)
SELECT notify_expiring_documents();

-- 3. أرشفة السجلات القديمة (شهرياً)
DELETE FROM audit_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '6 months';

-- 4. تحديث الإحصائيات (أسبوعياً)
ANALYZE;
VACUUM;

-- 5. إعادة بناء الفهارس (شهرياً)
REINDEX DATABASE company_docs_db;
```

## 🔐 أمان قاعدة البيانات

### Row-Level Security (RLS)

```sql
-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own companies or shared companies
CREATE POLICY company_access_policy ON companies
  FOR SELECT
  USING (
    owner_id = current_setting('app.current_user_id')::UUID
    OR id IN (
      SELECT company_id FROM company_shares 
      WHERE shared_with_user_id = current_setting('app.current_user_id')::UUID
        AND status = 'active'
    )
    OR current_setting('app.current_user_role') IN ('super_admin', 'admin', 'supervisor')
  );

-- Policy: Users can only update their own companies
CREATE POLICY company_update_policy ON companies
  FOR UPDATE
  USING (
    owner_id = current_setting('app.current_user_id')::UUID
    OR current_setting('app.current_user_role') IN ('super_admin', 'admin')
  );
```

### الأدوار والصلاحيات

```sql
-- Create database roles
CREATE ROLE app_admin;
CREATE ROLE app_supervisor;
CREATE ROLE app_employee;
CREATE ROLE app_readonly;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT SELECT, INSERT, UPDATE ON companies, documents TO app_employee;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
```

## 📈 مؤشرات الأداء

```sql
-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

## 📝 ملاحظات

1. جميع الـ UUIDs تستخدم `gen_random_uuid()` من PostgreSQL 13+
2. جميع الـ timestamps بتوقيت UTC
3. النصوص العربية تستخدم UTF-8 encoding
4. جميع الجداول المهمة لها audit trail
5. استخدام JSONB للبيانات المرنة بدلاً من JSON لسرعة الاستعلام
6. الفهارس GIN للبحث في النصوص والمصفوفات وJSONB
7. استخدام CHECK constraints للتحقق من صحة البيانات
8. Foreign Keys مع ON DELETE CASCADE حسب الحاجة

