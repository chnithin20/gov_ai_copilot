import { useState, useMemo, useEffect } from 'react';
import { mockRAGRules } from '../utils/data';
import { playSound } from '../utils/soundEngine';
import DocumentPreviewModal from './DocumentPreviewModal';

const draftTemplates = {
  'Driving License Renewal': `OFFICE OF THE REGIONAL TRANSPORT OFFICER
West Delhi Division

Ref: TX-1002 / DL-RENEWAL / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
The Applicant — Amit Sen

Subject: Acknowledgement of Driving License Renewal Application

Dear Sir/Madam,

This is to acknowledge receipt of your application for renewal of Driving License bearing number DL-142019992. Your application has been processed through the Government AI Copilot system.

Verification Status:
• Identity Verification: PASSED (OCR Confirmed)
• Medical Certificate (Form 1A): VERIFIED
• Document Integrity Hash: sha256:d84f...c120

Your renewed license will be dispatched within 7–10 working days to the registered address. For status tracking, use Transaction ID: TX-1002.

Regards,
Desk Officer, West Delhi RTO
(Auto-generated via Gov AI Copilot)`,

  'Agricultural Crop Subsidy': `OFFICE OF THE BLOCK AGRICULTURAL OFFICER
Bilga Block, Punjab

Ref: TX-1481 / AGRI-SUBSIDY / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri Baldev Singh, Village Bilga

Subject: Disaster Relief Grant – Crop Compensation Processing

Dear Farmer,

Your application for crop damage compensation under the State Disaster Response Fund (SDRF) 2026 has been successfully received and verified.

Assessment Summary:
• Land Holding: 4.2 Hectares (Khewat-45)
• Damage Assessment: +65% flooding damage confirmed
• Eligibility: CONFIRMED under SDRF guidelines

The compensation amount will be calculated by the District Revenue Office and credited to your linked bank account within 30 days.

Regards,
Block Agricultural Officer, Bilga
(Auto-generated via Gov AI Copilot)`,

  'Birth Registration': `OFFICE OF THE MUNICIPAL REGISTRAR
City Corporation

Ref: TX-9052 / BIRTH-REG / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri Suresh Sharma

Subject: Birth Registration Confirmation

Dear Sir,

The birth registration for your child (Baby Girl of S. Sharma) born on 2026-07-03 at City General Maternity Hospital has been successfully processed.

Registration Details:
• Registration completed within 21-day free window
• Hospital discharge summary: VERIFIED
• Municipal Registration Code 1969 compliance: CONFIRMED

The official Birth Certificate will be available for collection within 5 working days.

Regards,
Municipal Registrar
(Auto-generated via Gov AI Copilot)`,

  'Death Registration': `OFFICE OF THE MUNICIPAL REGISTRAR
City Corporation

Ref: TX-4491 / DEATH-REG / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri Sunil Kumar

Subject: Death Registration Confirmation

Dear Sir,

The death registration for Ramesh Kumar (Demised on 2026-06-28) has been successfully verified.

Registration Details:
• Demise Registry completed within 21-day free window
• Cause of Demise Certificate: VERIFIED (District Civil Hospital)
• Informant relation status: VERIFIED (Son)

The official Death Certificate will be issued and dispatched shortly.

Regards,
Municipal Registrar
(Auto-generated via Gov AI Copilot)`,

  'Rythu Bandhu Scheme': `OFFICE OF THE BLOCK AGRICULTURAL OFFICER
Kallur Block, Khammam, Telangana

Ref: TX-7104 / RYTHU-BANDHU / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri K. Srinivasa Rao

Subject: Rythu Bandhu Investment Support Grant

Dear Farmer,

We are pleased to inform you that your Rythu Bandhu farmer investment support application has been verified and registered.

Assessment Details:
• Pattadar Passbook Number: TS-RYTHU-88219 (Khammam District)
• Farm Land Size: 3.5 Acres
• Agri support grant calculated: ₹17,500 (@ ₹5,000 per acre)

The DBT amount will be credited to your linked SBI account (Acc: ******9821) shortly.

Regards,
Block Agricultural Development Officer, Kallur
(Auto-generated via Gov AI Copilot)`,

  'Aadhaar Details Update': `UNIQUE IDENTIFICATION AUTHORITY OF INDIA
UIDAI Registrar Division, New Delhi

Ref: TX-8821 / AADHAAR-UPDATE / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Ms. Ananya Sharma

Subject: Aadhaar Demographic Update Processing

Dear Resident,

Your request for updating demographic details on Aadhaar Number 3298 4810 9924 has been verified.

Update Summary:
• Update Request Field: Address
• Proof Submitted: Utility Bill (BSES Yamuna) - VERIFIED
• New Registered Address: H-43, Sector 15, Rohini, Delhi

Your updated Aadhaar letter will be dispatched to your new address. You can also download the e-Aadhaar online.

Regards,
UIDAI Verification Desk
(Auto-generated via Gov AI Copilot)`,

  'PAN Card Application': `INCOME TAX DEPARTMENT
NSDL/UTIITSL Processing Center

Ref: TX-1194 / PAN-CARD / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri Rajesh Patel

Subject: Permanent Account Number (PAN) Allocation

Dear Applicant,

We have received and verified your Form 49A application for a new PAN card.

Verification Summary:
• Name: Rajesh Patel
• Date of Birth: 1991-03-24
• Verification Protocol: NSDL Aadhaar e-Sign - SUCCESSFUL

Your new PAN card is being printed and will be dispatched in 10-15 working days. An e-PAN card has been sent to your email.

Regards,
Income Tax Desk
(Auto-generated via Gov AI Copilot)`,

  'Income Certificate': `OFFICE OF THE TEHSILDAR
Jaipur Rural Division, Rajasthan

Ref: TX-5510 / INCOME-CERT / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Smt. Meera Bai

Subject: Issuance of Annual Income Certificate

Dear Citizen,

Your application for the issuance of an Annual Income Certificate has been verified.

Details:
• Verified Annual Family Income: ₹3,00,000/-
• Income Proof Document: Bank Statement (6M) - VERIFIED
• Purpose: Higher Education Fee Waiver

The official Income Certificate is hereby approved and logged in the digital register.

Regards,
Tehsildar, Jaipur Rural
(Auto-generated via Gov AI Copilot)`,

  'Caste Certificate': `OFFICE OF THE BLOCK DEVELOPMENT OFFICER
Patna Sadar, Bihar

Ref: TX-6629 / CASTE-CERT / 2026
Date: ${new Date().toLocaleDateString('en-IN')}

To,
Shri Vikranth Yadav

Subject: SC/ST/OBC/EWS Caste Certificate Processing

Dear Applicant,

Your application for Caste Certificate verification has been successfully verified.

Details:
• Category: Other Backward Classes (OBC)
• Sub-caste: Yadav
• Proof Verified: Father's Caste Certificate (1992) - MATCHED

The Caste Certificate will be available in your DigiLocker.

Regards,
Block Development Officer, Patna Sadar
(Auto-generated via Gov AI Copilot)`
};

export default function OfficerWorkstation({ soundEnabled, applications = [], onUpdateStatus, onRefreshDB, ledgerEntries = [] }) {
  const [selectedApp, setSelectedApp] = useState(() => {
    try {
      const saved = localStorage.getItem('gov_officer_selectedApp');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('gov_officer_activeTab');
      if (saved && ['queue', 'ledger', 'analytics', 'config'].includes(saved)) return saved;
    } catch (e) {}
    return 'queue';
  });
  const [draftVisible, setDraftVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    localStorage.setItem('gov_officer_selectedApp', JSON.stringify(selectedApp || null));
  }, [selectedApp]);

  useEffect(() => {
    localStorage.setItem('gov_officer_activeTab', activeTab);
  }, [activeTab]);

  const safeApps = useMemo(() => Array.isArray(applications) ? applications : [], [applications]);
  const safeLedger = useMemo(() => Array.isArray(ledgerEntries) ? ledgerEntries : [], [ledgerEntries]);

  const stats = useMemo(() => ({
    total: safeApps.length,
    pending: safeApps.filter(a => a && (a.status || '').toLowerCase() === 'pending').length,
    approved: safeApps.filter(a => a && (a.status || '').toLowerCase() === 'approved').length,
    rejected: safeApps.filter(a => a && (a.status || '').toLowerCase() === 'rejected').length,
  }), [safeApps]);

  const matchedRules = useMemo(() => {
    if (!selectedApp || !selectedApp.service) return [];
    const service = String(selectedApp.service).toLowerCase();
    return (Array.isArray(mockRAGRules) ? mockRAGRules : []).filter(r => {
      if (!r || !r.title) return false;
      const title = String(r.title).toLowerCase();
      if (service.includes('license') && (title.includes('license') || title.includes('motor'))) return true;
      if (service.includes('agri') && (title.includes('crop') || title.includes('disaster'))) return true;
      if (service.includes('birth') && (title.includes('birth') || title.includes('municipal'))) return true;
      if (service.includes('death') && (title.includes('death') || title.includes('municipal'))) return true;
      if (service.includes('rythu') && (title.includes('rythu') || title.includes('crop') || title.includes('disaster'))) return true;
      if (service.includes('aadhaar') && (title.includes('aadhaar'))) return true;
      if (service.includes('pan') && (title.includes('pan') || title.includes('income tax'))) return true;
      if (service.includes('income') && (title.includes('income') || title.includes('revenue') || title.includes('public service'))) return true;
      if (service.includes('caste') && (title.includes('caste') || title.includes('public service'))) return true;
      return false;
    });
  }, [selectedApp]);

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setDraftVisible(false);
    if (soundEnabled) playSound('click');
  };

  const handleApprove = (e, appId) => {
    e.stopPropagation();
    onUpdateStatus(appId, 'Approved');
  };

  const handleReject = (e, appId) => {
    e.stopPropagation();
    onUpdateStatus(appId, 'Rejected');
  };

  return (
    <section className="workspace-view active" id="viewOfficer">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>Officer Administrative Desk</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Database Connected
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>Connected to officer_dashboard_tasks table — Verify documents and process live applications</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onRefreshDB && (
            <button
              onClick={() => onRefreshDB()}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}
              title="Sync latest citizen applications from Database"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Sync Live DB
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar fade-in-up">
        <div className="stat-card glass-card">
          <div className="stat-icon cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="officer-grid" style={{ marginTop: 20 }}>
        {/* Left Panel - Queue / RAG */}
        <div className="officer-left">
          <div className="glass-panel">
            <div className="tabs-header">
              <button className={`tab-link ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
                Application Queue
              </button>
              <button className={`tab-link ${activeTab === 'rag' ? 'active' : ''}`} onClick={() => setActiveTab('rag')}>
                RAG Knowledge Base
              </button>
            </div>

            {activeTab === 'queue' && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Citizen</th>
                      <th>Service</th>
                      <th>Language</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr
                        key={app.id}
                        className={selectedApp?.id === app.id ? 'selected' : ''}
                        onClick={() => handleSelectApp(app)}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{app.id}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{app.name}</td>
                        <td>{app.service}</td>
                        <td>{app.language}</td>
                        <td>
                          <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                        </td>
                        <td>
                          {app.status === 'Pending' ? (
                            <div className="action-btns">
                              <button className="btn-approve" onClick={(e) => handleApprove(e, app.id)}>Approve</button>
                              <button className="btn-reject" onClick={(e) => handleReject(e, app.id)}>Reject</button>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'rag' && (
              <div style={{ padding: 20 }}>
                <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                  Official government regulations and policies indexed for AI-powered retrieval.
                </p>
                {mockRAGRules.map((rule, i) => (
                  <div key={i} className="rag-card glass-card">
                    <h5>{rule.title}</h5>
                    <p>{rule.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="officer-right glass-panel">
          {selectedApp ? (
            <>
              <div className="panel-header">
                <div className="header-left">
                  <span className="panel-badge cyan">{selectedApp.id || 'N/A'}</span>
                  <h3>{selectedApp.name || 'Anonymous Applicant'}</h3>
                </div>
                <span className={`status-badge ${(selectedApp.status || 'pending').toLowerCase()}`}>{selectedApp.status || 'Pending'}</span>
              </div>

              <div className="detail-section">
                <h4>Application Details</h4>
                {Object.entries(selectedApp.fields || {}).map(([key, val]) => (
                  <div key={key} className="detail-field-row">
                    <span className="detail-field-label">{key}</span>
                    <span className="detail-field-value">{String(val || '')}</span>
                  </div>
                ))}
              </div>

              {selectedApp.attachments && Array.isArray(selectedApp.attachments) && selectedApp.attachments.length > 0 && (
                <div className="detail-section">
                  <h4>Attached Documents</h4>
                  {selectedApp.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="upload-item"
                      style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(0, 242, 254, 0.25)', background: 'rgba(0, 242, 254, 0.04)' }}
                      onClick={() => setPreviewDoc(att)}
                      title="Click to inspect OCR & ledger verification"
                    >
                      <div className="upload-item-info">
                        <div className="upload-item-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="upload-item-details">
                          <strong>{att.name || 'Document'}</strong>
                          <span>{att.size || 'Unknown'} • {att.type || 'File'}</span>
                        </div>
                      </div>
                      <span className="ocr-result-badge" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        👁️ Verified (Click to View)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="detail-section">
                <h4>AI Case Summary</h4>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>{selectedApp.summary || 'No summary available for this case.'}</p>
              </div>

              {matchedRules.length > 0 && (
                <div className="detail-section">
                  <h4>RAG Retrieved Policies</h4>
                  {matchedRules.map((rule, i) => (
                    <div key={i} className="rag-card glass-card" style={{ marginBottom: 10 }}>
                      <h5>{rule.title}</h5>
                      <p>{rule.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="detail-section">
                <h4>AI Document Generator</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
                  Generate an official response letter using AI based on the application data and retrieved policies.
                </p>
                <button
                  className="generate-btn"
                  onClick={() => {
                    setDraftVisible(true);
                    if (soundEnabled) playSound('success');
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Generate Draft Letter
                </button>
                {draftVisible && (
                  <div className="doc-draft-area fade-in-up" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {draftTemplates[selectedApp.service] || `Official response for ${selectedApp.service || 'application'} — Draft generated by AI Copilot.`}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <h4>Select an Application</h4>
              <p>Click on any case from the queue to view full details, retrieve matching policies, and generate official response documents.</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        soundEnabled={soundEnabled}
      />
    </section>
  );
}
