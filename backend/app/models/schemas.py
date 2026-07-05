import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from pydantic import BaseModel, Field

from app.core.database import Base

# ==========================================
# SQLAlchemy Models
# ==========================================

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    document_type = Column(String(50), nullable=True)  # Circular, Act, Notification, FAQ, Policy
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    meta_data = Column(JSONB, default=dict, nullable=False)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)  # Size of text-embedding-3-small or text-embedding-ada-002
    meta_data = Column(JSONB, default=dict, nullable=False)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(100), nullable=False, index=True)
    query = Column(Text, nullable=False)
    translated_query = Column(Text, nullable=True)
    response = Column(Text, nullable=False)
    citations = Column(JSONB, default=list, nullable=False)
    confidence = Column(Float, default=1.0)
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class AuditLedger(Base):
    __tablename__ = "audit_ledger"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tx_id = Column(String(100), nullable=False, unique=True, index=True)
    department = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    details = Column(JSONB, default=dict, nullable=False)
    status = Column(String(50), default="VERIFIED")
    integrity_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Citizen(Base):
    __tablename__ = "citizens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), nullable=False, unique=True, index=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True, index=True)
    email = Column(String(150), nullable=True)
    preferred_language = Column(String(10), default="en")
    aadhaar_masked = Column(String(20), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_number = Column(String(100), nullable=False, unique=True, index=True)
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("citizens.id", ondelete="SET NULL"), nullable=True)
    service_type = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="SUBMITTED", index=True)
    form_data = Column(JSONB, default=dict, nullable=False)
    uploaded_documents = Column(JSONB, default=list, nullable=False)
    remarks = Column(Text, nullable=True)
    assigned_officer = Column(String(100), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class OfficerTask(Base):
    __tablename__ = "officer_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    officer_username = Column(String(100), nullable=False, index=True)
    task_type = Column(String(100), default="DOCUMENT_VERIFICATION")
    status = Column(String(50), default="PENDING", index=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

class OfficerDashboardTask(Base):
    __tablename__ = "officer_dashboard_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(String(20), unique=True, nullable=False, index=True)
    citizen_name = Column(String(100), nullable=False)
    service_name = Column(String(150), nullable=False)
    language = Column(String(50), nullable=True)
    status = Column(String(20), default="Pending", index=True)
    full_name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    document_number = Column(String(50), nullable=True)
    office_authority = Column(String(100), nullable=True)
    document_hash = Column(Text, nullable=True)
    physical_verification = Column(String(100), nullable=True)
    document_1_name = Column(String(255), nullable=True)
    document_1_size = Column(String(50), nullable=True)
    document_1_status = Column(String(50), nullable=True)
    document_2_name = Column(String(255), nullable=True)
    document_2_size = Column(String(50), nullable=True)
    document_2_status = Column(String(50), nullable=True)
    assigned_officer = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ==========================================
# Pydantic Schemas
# ==========================================

class ChatRequest(BaseModel):
    message: str = Field(..., description="Query from the citizen")
    language: str = Field("en", description="Preferred language code (e.g. en, hi, te, ta, kn, bn, mr)")
    session_id: str = Field(..., description="Unique chat session ID")

class CitationInfo(BaseModel):
    source: str = Field(..., description="Source document name or URL")
    page: Optional[int] = Field(None, description="Page number if applicable")
    content: str = Field(..., description="Matching snippet from the source")
    confidence: float = Field(1.0, description="Match score of the chunk")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI agent generated response (translated back to user's language)")
    citations: List[CitationInfo] = Field(default_factory=list, description="Citations and evidence for the answer")
    confidence: float = Field(..., description="Confidence score of response")
    sources: List[str] = Field(default_factory=list, description="List of unique source document titles/links referenced")

class UploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    status: str

class CitizenProfile(BaseModel):
    username: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_language: str = "en"
    aadhaar_masked: Optional[str] = None
    is_verified: bool = True

class ServiceRequestInfo(BaseModel):
    application_number: str
    service_type: str
    department: str
    status: str
    form_data: Dict[str, Any] = Field(default_factory=dict)
    submitted_at: datetime

class AuditLedgerEntry(BaseModel):
    tx_id: str
    department: str
    event_type: str
    details: Dict[str, Any] = Field(default_factory=dict)
    status: str = "VERIFIED"
    integrity_hash: str
    created_at: datetime

class OfficerTaskInfo(BaseModel):
    task_id: str
    application_number: str
    officer_username: str
    task_type: str
    status: str
    assigned_at: datetime
