import { useTranslation } from 'react-i18next';
import { playSound } from '../utils/soundEngine';

export default function LandingPortal({ onNavigate, soundEnabled }) {
  const { t } = useTranslation();
  const handleLaunch = (view) => {
    if (soundEnabled) playSound('swoosh');
    onNavigate(view);
  };

  return (
    <section className="workspace-view active" id="viewLanding">
      <div className="landing-hero">
        <div className="badge glow-indigo-purple">{t('landing.badge')}</div>
        <h1>{t('landing.title')}</h1>
        <p className="hero-desc">
          {t('landing.subtitle')}
        </p>
      </div>

      <div className="portal-cards-grid">
        <div className="portal-selection-card glass-card" onClick={() => handleLaunch('citizen')}>
          <div className="portal-card-icon text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2>{t('landing.citizen')}</h2>
          <p>{t('landing.citizenDesc')}</p>
          <button className="launch-btn accent-btn">Launch Portal →</button>
        </div>

        <div className="portal-selection-card glass-card" onClick={() => handleLaunch('officer')}>
          <div className="portal-card-icon text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h2>{t('landing.officer')}</h2>
          <p>{t('landing.officerDesc')}</p>
          <button className="launch-btn primary-btn">Open Workstation →</button>
        </div>

        <div className="portal-selection-card glass-card" onClick={() => handleLaunch('admin')}>
          <div className="portal-card-icon text-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2>{t('landing.admin')}</h2>
          <p>{t('landing.adminDesc')}</p>
          <button className="launch-btn secondary-btn">View Ledgers →</button>
        </div>
      </div>
    </section>
  );
}
