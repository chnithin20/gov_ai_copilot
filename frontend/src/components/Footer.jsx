import { useTranslation } from 'react-i18next';
import { playSound } from '../utils/soundEngine';

export default function Footer({ onNavigate, activeView, soundEnabled, ledgerEntries = [] }) {
  const { t } = useTranslation();

  const handleNavClick = (view) => {
    if (soundEnabled) playSound('swoosh');
    onNavigate(view);
  };

  // Get dynamic ledger stats
  const totalTx = Array.isArray(ledgerEntries) ? ledgerEntries.length : 0;
  const latestHash = totalTx > 0 && ledgerEntries[totalTx - 1]?.hash 
    ? `${ledgerEntries[totalTx - 1].hash.substring(0, 8)}...${ledgerEntries[totalTx - 1].hash.substring(24)}`
    : 'genesis_block_init';

  return (
    <footer className="app-footer">
      <div className="footer-glow-line"></div>
      
      <div className="footer-grid">
        {/* Column 1: Impact & Branding */}
        <div className="footer-col branding-col">
          <div className="footer-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="footer-logo">
              <defs>
                <linearGradient id="footerGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#footerGrad)" fill="rgba(6,182,212,0.05)" />
              <polyline points="12 11 12 17" stroke="url(#footerGrad)" />
              <circle cx="12" cy="7" r="1" fill="url(#footerGrad)" />
            </svg>
            <span className="brand-name">Gov AI Copilot</span>
          </div>
          <p className="footer-motto">
            Secure administrative orchestration bridging public policy, citizen applications, and cryptographic transparency.
          </p>
          <div className="status-indicator">
            <span className="status-beacon pulsing"></span>
            <span className="status-text">System Status: Active</span>
          </div>
        </div>

        {/* Column 2: Dynamic Navigation */}
        <div className="footer-col links-col">
          <h3>Navigation</h3>
          <ul className="footer-links">
            <li>
              <button 
                className={`footer-nav-link ${activeView === 'landing' ? 'active' : ''}`}
                onClick={() => handleNavClick('landing')}
              >
                <span className="link-bullet">›</span> {t('common.home')}
              </button>
            </li>
            <li>
              <button 
                className={`footer-nav-link ${activeView === 'citizen' ? 'active' : ''}`}
                onClick={() => handleNavClick('citizen')}
              >
                <span className="link-bullet">›</span> {t('nav.citizen')}
              </button>
            </li>
            <li>
              <button 
                className={`footer-nav-link ${activeView === 'officer' ? 'active' : ''}`}
                onClick={() => handleNavClick('officer')}
              >
                <span className="link-bullet">›</span> {t('nav.officer')}
              </button>
            </li>
            <li>
              <button 
                className={`footer-nav-link ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin')}
              >
                <span className="link-bullet">›</span> {t('nav.admin')}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Empowerment & Cryptographic Trust */}
        <div className="footer-col trust-col">
          <h3>Audit & Security</h3>
          <div className="trust-stats">
            <div className="trust-stat-item">
              <span className="stat-label">Verification Standard:</span>
              <span className="stat-value text-cyan">SHA-256 Ledgering</span>
            </div>
            <div className="trust-stat-item">
              <span className="stat-label">Audited Blocks:</span>
              <span className="stat-value text-purple">{totalTx} Transactions</span>
            </div>
            <div className="trust-stat-item">
              <span className="stat-label">Last State Hash:</span>
              <code className="stat-hash text-muted" title={totalTx > 0 ? ledgerEntries[totalTx - 1].hash : 'Genesis block init'}>
                {latestHash}
              </code>
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lock-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Secured Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Column 4: Operational Environment */}
        <div className="footer-col env-col">
          <h3>Environment</h3>
          <div className="env-details">
            <div className="env-row">
              <span className="env-label">Host Node:</span>
              <span className="env-value">local-gateway.gov.in</span>
            </div>
            <div className="env-row">
              <span className="env-label">DB Connection:</span>
              <span className="env-value text-green">Connected</span>
            </div>
            <div className="env-row">
              <span className="env-label">Version:</span>
              <span className="env-value">v2.6.4-prod</span>
            </div>
            <div className="env-row">
              <span className="env-label">Core Runtime:</span>
              <span className="env-value">Vite + React + FastAPI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p className="copyright-text">
            © 2026 Department of Digital Administration. Secured with Cryptographic Multi-Party Trust. All rights reserved.
          </p>
          <div className="compliance-tags">
            <span className="tag">Section 139A Compliance</span>
            <span className="tag-divider">|</span>
            <span className="tag">RTI Act Auditable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
