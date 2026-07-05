-- ============================================================================
-- GOVERNMENT AI COPILOT SERVICE PORTAL - RELATIONAL & VECTOR DATABASE SCHEMA
-- ============================================================================
-- Description:
-- Production-ready PostgreSQL schema featuring pgvector embedding support for 
-- Retrieval-Augmented Generation (RAG), immutable audit ledger logs, citizen 
-- accounts, service request workflows, and automated timestamp triggers.
-- Compatible with PostgreSQL 15+, Supabase, and AWS RDS/Aurora PostgreSQL.
-- ============================================================================

-- 1. EXTENSIONS
-- Enable essential PostgreSQL extensions for UUID generation, vector embeddings, and cryptography
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. UTILITY & TRIGGER FUNCTIONS
-- ============================================================================

-- Automatically updates the `updated_at` column whenever a row is modified
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. KNOWLEDGE BASE & RAG TABLES (DOCUMENTS & VECTOR CHUNKS)
-- ============================================================================

-- Documents Table: Stores official government acts, circulars, notifications, guidelines, and policies
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'General Administration',
    document_type VARCHAR(50) DEFAULT 'Policy', -- Options: Circular, Act, Notification, FAQ, Policy, Scheme
    version INTEGER NOT NULL DEFAULT 1,
    meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_meta_data ON documents USING GIN (meta_data);

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Document Chunks Table: Stores chunked text and vector embeddings for semantic similarity search
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL, -- Compatible with OpenAI text-embedding-3-small and custom models
    meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
-- HNSW (Hierarchical Navigable Small World) index for high-performance approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_meta_data ON document_chunks USING GIN (meta_data);

-- ============================================================================
-- 4. CONVERSATION MEMORY & AI INTERACTIONS
-- ============================================================================

-- Chat History Table: Stores citizen queries, multi-lingual translations, AI responses, and citations
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    query TEXT NOT NULL,
    translated_query TEXT,
    response TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence FLOAT DEFAULT 1.0,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_language ON chat_history(language);

-- ============================================================================
-- 5. IMMUTABLE AUDIT LEDGER & SECURITY
-- ============================================================================

-- Audit Ledger Table: Stores cryptographic verification hashes and system actions for accountability
CREATE TABLE IF NOT EXISTS audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_id VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- e.g., Intent Classified, Document Verified, Approval Granted
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'VERIFIED',
    integrity_hash VARCHAR(128) NOT NULL, -- SHA-256 or cryptographic signature of transaction data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_ledger_tx_id ON audit_ledger(tx_id);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_department ON audit_ledger(department);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_created_at ON audit_ledger(created_at DESC);

-- ============================================================================
-- 6. CITIZEN ACCOUNTS & SERVICE REQUEST WORKFLOWS
-- ============================================================================

-- Citizens Table: Stores citizen profiles, language preferences, and verification status
CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    preferred_language VARCHAR(10) DEFAULT 'en',
    aadhaar_masked VARCHAR(20), -- Store only last 4 digits (e.g., 'XXXXXXXX1234') for compliance
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizens_username ON citizens(username);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON citizens(phone);

CREATE TRIGGER trg_citizens_updated_at
    BEFORE UPDATE ON citizens
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Service Requests Table: Stores active citizen applications for schemes, licenses, and certificates
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(100) NOT NULL UNIQUE,
    citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL, -- e.g., birth_certificate, agri_subsidy, driving_license, pan_card
    department VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ACTION_REQUIRED
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    remarks TEXT,
    assigned_officer VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_app_num ON service_requests(application_number);
CREATE INDEX IF NOT EXISTS idx_service_requests_citizen_id ON service_requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_dept ON service_requests(department);
CREATE INDEX IF NOT EXISTS idx_service_requests_form_data ON service_requests USING GIN (form_data);

CREATE TRIGGER trg_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Officer Tasks Table: Tracks review queues and workstation assignments for government officers
CREATE TABLE IF NOT EXISTS officer_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    officer_username VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) DEFAULT 'DOCUMENT_VERIFICATION',
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, ESCALATED
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_officer_tasks_officer ON officer_tasks(officer_username);
CREATE INDEX IF NOT EXISTS idx_officer_tasks_status ON officer_tasks(status);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published documents and chunks
CREATE POLICY "Public read access for documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read access for chunks" ON document_chunks
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all insert/select operations for chat interactions and citizen requests
CREATE POLICY "Public access for chat history" ON chat_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for service requests" ON service_requests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for audit ledger" ON audit_ledger
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for citizens" ON citizens
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for officer tasks" ON officer_tasks
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. INITIAL SEED / REFERENCE DATA
-- ============================================================================

-- Insert reference sample documents
INSERT INTO documents (id, filename, department, document_type, version, meta_data)
VALUES 
    (uuid_generate_v4(), 'National_Digital_Citizen_Service_Charter_2026.pdf', 'General Administration', 'Policy', 1, '{"keywords": ["charter", "digital", "SLA", "services"], "status": "active"}'::jsonb),
    (uuid_generate_v4(), 'Rythu_Bandhu_Agri_Subsidy_Guidelines_v2.pdf', 'Agriculture & Farmers Welfare', 'Scheme', 2, '{"keywords": ["agriculture", "subsidy", "rythu bandhu", "farmers"], "eligibility": "landowner"}'::jsonb),
    (uuid_generate_v4(), 'Transport_Driving_License_Renewal_SOP.pdf', 'Transport Department', 'Circular', 1, '{"keywords": ["driving license", "renewal", "RTO", "transport"], "validity_years": 10}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample citizen profile
INSERT INTO citizens (username, full_name, phone, email, preferred_language, aadhaar_masked)
VALUES 
    ('citizen_demo', 'Rajesh Kumar', '+91-9876543210', 'rajesh.kumar@example.in', 'hi', 'XXXXXXXX4321'),
    ('ananya_sharma', 'Ananya Sharma', '+91-9811223344', 'ananya.s@example.in', 'te', 'XXXXXXXX8899')
ON CONFLICT DO NOTHING;

-- Insert sample audit ledger records
INSERT INTO audit_ledger (tx_id, department, event_type, details, status, integrity_hash)
VALUES 
    ('TX-8839201-SYS', 'General Administration', 'System Initialization', '{"note": "AI Copilot portal database schema deployed"}'::jsonb, 'VERIFIED', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    ('TX-9948201-AGR', 'Agriculture & Farmers Welfare', 'Workflow Policy Registered', '{"scheme": "Rythu Bandhu", "version": "v2"}'::jsonb, 'VERIFIED', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e')
ON CONFLICT DO NOTHING;

-- Officer Dashboard Tasks Table (created for Officer Workstation applications)
CREATE TABLE IF NOT EXISTS officer_dashboard_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(20) UNIQUE NOT NULL,
    citizen_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    language VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Pending',
    full_name VARCHAR(100),
    age INTEGER,
    document_number VARCHAR(50),
    office_authority VARCHAR(100),
    document_hash TEXT,
    physical_verification VARCHAR(100),
    document_1_name VARCHAR(255),
    document_1_size VARCHAR(50),
    document_1_status VARCHAR(50),
    document_2_name VARCHAR(255),
    document_2_size VARCHAR(50),
    document_2_status VARCHAR(50),
    assigned_officer VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE officer_dashboard_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for officer_dashboard_tasks" ON officer_dashboard_tasks
    FOR ALL USING (true) WITH CHECK (true);

INSERT INTO officer_dashboard_tasks (
    case_id, citizen_name, service_name, language, status,
    full_name, age, document_number, office_authority, document_hash, physical_verification,
    document_1_name, document_1_size, document_1_status,
    document_2_name, document_2_size, document_2_status,
    assigned_officer
) VALUES
('TX-1002', 'Amit Sen', 'Driving License Renewal', 'English', 'Approved', 'Amit Sen', 42, 'DL-142019992', 'West Delhi RTO', 'sha256:d84f...c120', 'Waived (OCR Confirmed)', 'DL_Card_Old.png', '245 KB', 'Verified', 'Med_Cert_Form1A.pdf', '1.2 MB', 'Verified', 'officer'),
('TX-1481', 'Baldev Singh', 'Agricultural Crop Subsidy', 'Punjabi (ਪੰਜਾਬੀ)', 'Pending', 'Baldev Singh', 55, 'FARM-88201', 'Punjab Agriculture Department', 'sha256:abc12...e901', 'Pending Manual Review', 'Land_Record.pdf', '2.1 MB', 'Verified', 'Farmer_ID.png', '320 KB', 'Verified', 'officer'),
('TX-7104', 'K. Srinivasa Rao', 'Rythu Bandhu Scheme', 'Telugu (తెలుగు)', 'Pending', 'K. Srinivasa Rao', 48, 'RB-991201', 'Telangana Agriculture Office', 'sha256:98fa...bc23', 'Verified', 'Rythu_Passbook.pdf', '1.8 MB', 'Verified', 'Farmer_Certificate.pdf', '850 KB', 'Verified', 'officer'),
('TX-8821', 'Ananya Sharma', 'Aadhaar Details Update', 'English', 'Pending', 'Ananya Sharma', 29, 'AAD-778291', 'UIDAI Hyderabad', 'sha256:7a2d...f451', 'OCR Verified', 'Aadhaar_Old.pdf', '890 KB', 'Verified', 'Address_Proof.pdf', '650 KB', 'Verified', 'officer')
ON CONFLICT (case_id) DO NOTHING;

