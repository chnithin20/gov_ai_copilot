import React from 'react';
import { playSound } from '../utils/soundEngine';

export default function DocumentPreviewModal({ doc, onClose, soundEnabled = true }) {
  if (!doc) return null;

  const handleClose = () => {
    if (soundEnabled) playSound('click');
    onClose();
  };

  const handlePrint = () => {
    if (soundEnabled) playSound('click');
    window.print();
  };

  const handleDownload = () => {
    if (soundEnabled) playSound('success');
    const element = document.createElement("a");
    const fileContent = `OFFICIAL GOVERNMENT DOCUMENT COPY\n=================================\nDocument Name: ${doc.name}\nDocument Type: ${doc.type || 'Official Record'}\nSize: ${doc.size || 'Unknown'}\nTimestamp: ${new Date().toISOString()}\nStatus: VERIFIED BY CRYPTOGRAPHIC LEDGER & OCR ENGINE\n\n[OCR EXTRACTED CONTENT VALIDATED AGAINST NATIONAL DATABASE]`;
    const file = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = doc.name || "official_document.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Determine specific mock data based on document filename or type
  const getDocDetails = () => {
    const name = (doc.name || '').toLowerCase();
    if (name.includes('dl_card')) {
      return {
        title: 'REPUBLIC OF INDIA — DRIVING LICENSE',
        authority: 'Transport Department, RTO West Delhi Division',
        seal: '🛞 MOTOR VEHICLE ACT 2019',
        fields: [
          { label: 'License Number', value: 'DL-142019992' },
          { label: 'Holder Name', value: 'Amit Sen' },
          { label: 'Date of Birth / Age', value: '12/06/1984 (42 Years)' },
          { label: 'Blood Group', value: 'B+ Positive' },
          { label: 'Authorized Vehicle Class', value: 'MCWG / LMV-NT' },
          { label: 'Issue Date', value: '14/08/2004' },
          { label: 'Valid Till', value: '13/08/2024 (Renewal Required)' },
          { label: 'Address', value: 'C-42, Janakpuri West, New Delhi - 110058' }
        ],
        ocrConfidence: '99.8%',
        hash: 'sha256:4f87c2e0a2b8e391b490f238d748f29e'
      };
    } else if (name.includes('med_cert') || name.includes('form1a')) {
      return {
        title: 'MEDICAL FITNESS CERTIFICATE — FORM 1A',
        authority: 'National Medical Commission & RTO Authorized Medical Board',
        seal: '🩺 CERTIFIED MEDICAL PRACTITIONER',
        fields: [
          { label: 'Applicant Name', value: 'Amit Sen' },
          { label: 'Age / Gender', value: '42 Years / Male' },
          { label: 'Vision Test (Snellen)', value: '6/6 Both Eyes (With Corrective Lenses)' },
          { label: 'Color Blindness Test', value: 'Negative (Normal Trichromatic Vision)' },
          { label: 'Auditory & Motor Reflexes', value: 'Normal / Fit to Operate LMV' },
          { label: 'Examining Doctor', value: 'Dr. K. Verma (MBBS, MD - Reg No. DMC-49210)' },
          { label: 'Clinic Address', value: 'Verma Diagnostics & Care, Rajouri Garden' },
          { label: 'Date of Examination', value: '02/07/2026' }
        ],
        ocrConfidence: '99.5%',
        hash: 'sha256:8d9f10a2eb3e48e2348b9c2a4f9d48e5'
      };
    } else if (name.includes('punjab_land') || name.includes('land_record')) {
      return {
        title: 'JAMABANDI / OFFICIAL LAND REGISTRY SNAPSHOT',
        authority: 'Department of Revenue, Rehabilitation & Disaster Management, Govt of Punjab',
        seal: '🌾 STATE REVENUE REGISTRY',
        fields: [
          { label: 'Owner / Pattadar Name', value: 'Baldev Singh s/o Gurbachan Singh' },
          { label: 'Village & Block', value: 'Bilga, Tehsil Phillaur, Jalandhar' },
          { label: 'Khewat / Khatauni Number', value: 'Khewat-45 / Khatauni-112' },
          { label: 'Total Land Area', value: '4.2 Hectares (approx. 10.3 Acres)' },
          { label: 'Soil & Crop Classification', value: 'Chahi (Irrigated) / Kharif Paddy' },
          { label: 'Disaster Assessment Survey', value: 'Heavy Rainfall Flood Inundation (+65% crop loss)' },
          { label: 'Patwari Stamp & Signature', value: 'Verified by Halka Patwari (Bilga Circle)' },
          { label: 'Register Hash', value: 'PB-REV-2026-992104' }
        ],
        ocrConfidence: '98.9%',
        hash: 'sha256:2a98f12a3d0fbc28ed34b92c4f8d9a10'
      };
    } else if (name.includes('pattadar') || name.includes('rythu')) {
      return {
        title: 'TELANGANA PATTADAR PASSBOOK & LAND TITLE',
        authority: 'Dharani Integrated Land Records Management System, Govt of Telangana',
        seal: '🏛️ DHARANI LAND PORTAL',
        fields: [
          { label: 'Pattadar Passbook Number', value: 'TS-RYTHU-88219' },
          { label: 'Farmer Name', value: 'K. Srinivasa Rao s/o K. Venkataiah' },
          { label: 'District / Mandal / Village', value: 'Khammam / Kallur / Kallur Rural' },
          { label: 'Khata Number', value: 'Khata No. 408' },
          { label: 'Survey Number(s)', value: 'Sy. No. 142/A, 142/AA' },
          { label: 'Total Holding Extent', value: '3.50 Acres (1.41 Hectares)' },
          { label: 'Rythu Bandhu Subsidy Rate', value: '₹5,000 per Acre per Season (Total: ₹17,500)' },
          { label: 'Linked Aadhaar & Bank', value: 'XXXX-XXXX-2894 | SBI Kallur Branch' }
        ],
        ocrConfidence: '99.9%',
        hash: 'sha256:88ba2e9dfa3382901b0f19ce928d3ba1'
      };
    } else if (name.includes('electricity') || name.includes('bses')) {
      return {
        title: 'BSES YAMUNA POWER LIMITED — UTILITY BILL',
        authority: 'BSES Yamuna Power / NCT of Delhi Address Proof Record',
        seal: '⚡ ELECTRICITY UTILITY BILL',
        fields: [
          { label: 'Consumer Name', value: 'Ananya Sharma' },
          { label: 'CA Number / Meter ID', value: 'CA-102948192 / MTR-882109' },
          { label: 'Service Address', value: 'H-43, Sector 15, Rohini, Delhi - 110089' },
          { label: 'Billing Cycle', value: 'May 2026 – June 2026' },
          { label: 'Total Units Consumed', value: '342 kWh' },
          { label: 'Bill Amount & Status', value: '₹2,480.00 (PAID ONLINE)' },
          { label: 'UIDAI Address Proof Eligibility', value: 'VALID (Issued within last 3 months)' },
          { label: 'Digital Ledger Verification', value: 'BSES-DEL-2026-0612' }
        ],
        ocrConfidence: '99.7%',
        hash: 'sha256:a02f392bdd99eff382a93dfdca91cda2'
      };
    } else if (name.includes('hospital') && name.includes('discharge')) {
      return {
        title: 'HOSPITAL MATERNITY DISCHARGE SUMMARY',
        authority: 'City General Maternity Hospital, Municipal Health Department',
        seal: '🏥 MUNICIPAL HEALTH BOARD',
        fields: [
          { label: 'Patient / Mother Name', value: 'Smt. Meena Sharma w/o Suresh Sharma' },
          { label: 'Child Details', value: 'Baby Girl (Live Birth) — Weight: 3.1 kg' },
          { label: 'Date & Time of Birth', value: 'July 3, 2026 at 08:42 AM IST' },
          { label: 'Delivery Type', value: 'Normal Vaginal Delivery (Term 39 Weeks)' },
          { label: 'Attending Obstetrician', value: 'Dr. Anita Desai (MD Obstetrics)' },
          { label: 'Hospital IPD Number', value: 'IPD-2026-88129' },
          { label: 'Municipal Registration Window', value: 'Eligible for Free 21-Day Registration' },
          { label: 'Hospital Seal Verification', value: 'AUTHENTICATED DIGITAL SIGNATURE' }
        ],
        ocrConfidence: '99.4%',
        hash: 'sha256:f4a2b910c82d491082de'
      };
    } else if (name.includes('hospital') && name.includes('demise')) {
      return {
        title: 'MEDICAL CERTIFICATE OF CAUSE OF DEATH',
        authority: 'District Civil Hospital, Department of Public Health',
        seal: '🏥 CIVIL HOSPITAL REGISTRY',
        fields: [
          { label: 'Deceased Full Name', value: 'Ramesh Kumar' },
          { label: 'Age & Gender', value: '72 Years / Male' },
          { label: 'Date & Time of Demise', value: 'June 28, 2026 at 11:15 PM IST' },
          { label: 'Place of Occurrence', value: 'District Civil Hospital, ICU Ward 4' },
          { label: 'Primary Cause of Death', value: 'Acute Myocardial Infarction / Cardiopulmonary Arrest' },
          { label: 'Informant Name & Relation', value: 'Sunil Kumar (Son)' },
          { label: 'Medical Officer Signature', value: 'Dr. R. K. Gupta (Chief Medical Officer)' },
          { label: 'Registry Record Number', value: 'DCH-2026-062801' }
        ],
        ocrConfidence: '99.6%',
        hash: 'sha256:7e2b10f2a419c82b33b9ef'
      };
    } else if (name.includes('father_caste') || name.includes('caste')) {
      return {
        title: 'STATE CASTE CERTIFICATE — ANCESTRAL LINEAGE PROOF',
        authority: 'Office of the District Magistrate & Collectorate, Patna Sadar, Bihar',
        seal: '📜 STATE SOCIAL WELFARE DEPT',
        fields: [
          { label: 'Certificate Holder', value: 'Kailash Yadav s/o Ramdev Yadav' },
          { label: 'Relation to Applicant', value: 'Father of Vikranth Yadav' },
          { label: 'Caste & Sub-Caste', value: 'Other Backward Classes (OBC) — Yadav' },
          { label: 'Residential Address', value: 'Ward No. 12, Patna Sadar, Bihar' },
          { label: 'Certificate Issue Year', value: '1992 (Permanent Lineage Record)' },
          { label: 'Issuing Officer', value: 'Sub-Divisional Magistrate (SDM), Patna' },
          { label: 'Digital Ledger Cross-Reference', value: 'MATCHED WITH DISTRICT ARCHIVE #9921' },
          { label: 'Verification Status', value: 'VALID ANCESTRAL PROOF FOR OBC ISSUANCE' }
        ],
        ocrConfidence: '99.1%',
        hash: 'sha256:e02b4fa1892c4f82ccfda'
      };
    } else if (name.includes('bank_statement') || name.includes('6m')) {
      return {
        title: '6-MONTH CONSOLIDATED BANK STATEMENT',
        authority: 'State Bank of India — Jaipur Rural Branch (IFSC: SBIN0008921)',
        seal: '🏦 STATE BANK OF INDIA',
        fields: [
          { label: 'Account Holder Name', value: 'Smt. Meera Bai' },
          { label: 'Account Number', value: 'XXXX-XXXX-9912 (Savings Account)' },
          { label: 'Statement Period', value: 'Jan 1, 2026 – June 30, 2026' },
          { label: 'Average Monthly Credit', value: '₹25,000.00' },
          { label: 'Estimated Annual Income', value: '₹3,00,000.00 (Verified against declaration)' },
          { label: 'Primary Income Source', value: 'Agricultural Dairy & Artisan Cooperative Receipts' },
          { label: 'Bank Official Attestation', value: 'Digitally Signed by Branch Manager, SBI Jaipur' },
          { label: 'OCR Income Calculation', value: 'PASSED (Within Fee Waiver Threshold)' }
        ],
        ocrConfidence: '99.5%',
        hash: 'sha256:a92b210ff9948ec1209a'
      };
    } else if (name.includes('aadhaar_card') || name.includes('aadhaar')) {
      return {
        title: 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA — e-AADHAAR',
        authority: 'Government of India — UIDAI Central Registry',
        seal: '🇮🇳 GOVERNMENT OF INDIA',
        fields: [
          { label: 'Aadhaar Card Number', value: '8821 1904 1092' },
          { label: 'Resident Name', value: 'Rajesh Patel' },
          { label: 'Date of Birth', value: '24/03/1991' },
          { label: 'Gender', value: 'Male' },
          { label: 'Father Name', value: 'Harish Patel' },
          { label: 'Registered Address', value: '14-B, Sardar Patel Marg, Navrangpura, Ahmedabad, Gujarat' },
          { label: 'e-KYC Verification Status', value: 'SUCCESSFUL (NSDL e-Sign Handshake Verified)' },
          { label: 'Biometric & QR Hash', value: 'UIDAI-2026-99214801' }
        ],
        ocrConfidence: '99.9%',
        hash: 'sha256:b93a8d10228cfda88b12'
      };
    }

    // Generic fallback document
    return {
      title: 'OFFICIAL GOVERNMENT VERIFICATION DOCUMENT',
      authority: 'National AI Copilot Document Processing & OCR Engine',
      seal: '🏛️ GOVERNMENT DIGITAL ARCHIVE',
      fields: [
        { label: 'Document Name', value: doc.name || 'Untitled Document' },
        { label: 'File Format / Size', value: `${doc.type || 'PDF/Image'} • ${doc.size || '2.1 MB'}` },
        { label: 'Extraction Protocol', value: 'Optical Character Recognition (OCR) Engine v4.2' },
        { label: 'Integrity Status', value: 'No Cryptographic Tampering Detected' },
        { label: 'Audit Timestamp', value: new Date().toUTCString() },
        { label: 'Processing Desk', value: 'Automated Citizen Assistance Pipeline' },
        { label: 'Verification Score', value: '100% Match with National Database' }
      ],
      ocrConfidence: '99.4%',
      hash: `sha256:${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}`
    };
  };

  const details = getDocDetails();

  return (
    <div className="modal-overlay active fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(5, 11, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20
    }} onClick={handleClose}>
      <div className="glass-panel scale-in" style={{
        width: '100%', maxWidth: 720, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 20px 50px rgba(0, 242, 254, 0.25)',
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(10, 20, 35, 0.98) 100%)',
        overflow: 'hidden', borderRadius: 16
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0, 242, 254, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon cyan" style={{ width: 40, height: 40 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>{doc.name}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {doc.type || 'Official Verification Document'} • {doc.size || 'Verified Archive'}
              </span>
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            fontSize: '1.8rem', cursor: 'pointer', padding: '0 8px', lineHeight: 1
          }}>×</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Status Banner */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--accent-green)', fontSize: '1.3rem' }}>✓</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--accent-green)' }}>
                  OCR Extraction & LEDGER VERIFICATION SUCCESSFUL
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Confidence Score: <strong style={{ color: '#fff' }}>{details.ocrConfidence}</strong> • Integrity Hash Validated
                </span>
              </div>
            </div>
            <span className="status-badge approved" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              NATIONAL DB MATCH
            </span>
          </div>

          {/* Document Simulated Sheet */}
          <div style={{
            background: '#ffffff', color: '#1a202c', padding: '28px 32px',
            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: 'serif', position: 'relative', border: '1px solid #e2e8f0'
          }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '4.5rem', fontWeight: 900, color: 'rgba(0, 0, 0, 0.04)',
              pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0
            }}>
              OFFICIAL VERIFIED
            </div>

            {/* Sheet Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #2d3748', paddingBottom: 16, marginBottom: 20, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {details.seal}
              </div>
              <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.3rem', color: '#1a202c', fontWeight: 800, fontFamily: 'sans-serif' }}>
                {details.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#718096', fontStyle: 'italic' }}>
                {details.authority}
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h4 style={{ fontSize: '0.85rem', color: '#4a5568', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e0', paddingBottom: 6, marginBottom: 12, fontFamily: 'sans-serif' }}>
                Extracted Record Metadata (OCR Engine v4.2)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
                <tbody>
                  {(details.fields || []).map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7', background: idx % 2 === 0 ? '#f7fafc' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#4a5568', width: '42%' }}>{f && f.label ? f.label : 'Field'}:</td>
                      <td style={{ padding: '8px 12px', color: '#1a202c', fontWeight: 700 }}>{f && f.value ? f.value : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheet Footer Stamp */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #a0aec0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#718096', fontFamily: 'monospace', position: 'relative', zIndex: 1 }}>
              <div>
                <span>DIGITAL SIGNATURE HASH:</span><br/>
                <strong style={{ color: '#2b6cb0' }}>{details.hash}</strong>
              </div>
              <div style={{ textAlign: 'right', border: '2px solid #48bb78', color: '#2f855a', padding: '4px 12px', fontWeight: 800, borderRadius: 4, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                SEAL VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ⚡ Verified by Govt AI Copilot Ledger System
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🖨️ Print Document
            </button>
            <button onClick={handleDownload} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              📥 Download Copy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
