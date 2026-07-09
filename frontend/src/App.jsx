import { useState, useCallback, useEffect } from 'react'
import './App.css'
import ParticleBackground from './components/ParticleBackground'
import LandingPortal from './components/LandingPortal'
import CitizenPortal from './components/CitizenPortal'
import OfficerWorkstation from './components/OfficerWorkstation'
import AdminLedger from './components/AdminLedger'
import AuthPortal from './components/AuthPortal'
import Footer from './components/Footer'
import { initialApplications, initialLedger, generateHash } from './utils/data'
import { playSound } from './utils/soundEngine'

const defaultUsers = [
  { username: 'officer', password: 'govcopilot2026', role: 'officer', name: 'Officer Desk', fields: { officerId: 'OFF-1002', department: 'Transport Desk' } },
  { username: 'citizen', password: 'citizen123', role: 'citizen', name: 'Amit Sen', fields: { aadhaar: '123456789012' } },
  { username: 'admin', password: 'admin123', role: 'admin', name: 'System Auditor', fields: {} }
]; 

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gov_current_user');
    if (!saved) return null;
    try {
      const user = JSON.parse(saved);
      if (user.expiresAt && Date.now() > user.expiresAt) {
        localStorage.removeItem('gov_current_user');
        localStorage.removeItem('gov_active_view');
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  });

  const [activeView, setActiveView] = useState(() => {
    const savedView = localStorage.getItem('gov_active_view');
    const savedUser = localStorage.getItem('gov_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.expiresAt && Date.now() > u.expiresAt) {
          return 'landing';
        }
        if (savedView && ['citizen', 'officer', 'admin'].includes(savedView)) {
          return savedView;
        }
        return u.role || 'landing';
      } catch (e) {}
    }
    return 'landing';
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('gov_applications');
    return saved ? JSON.parse(saved) : initialApplications;
  });
  
  const [ledgerEntries, setLedgerEntries] = useState(() => {
    const saved = localStorage.getItem('gov_ledger_entries');
    return saved ? JSON.parse(saved) : initialLedger;
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('gov_users');
    return saved ? JSON.parse(saved) : defaultUsers;
  });

  const [authTargetRole, setAuthTargetRole] = useState('citizen');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    localStorage.setItem('gov_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    // Load existing citizens from backend / Supabase DB on startup
    const loadDbUsers = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/users');
        if (res.ok) {
          const dbUsers = await res.json();
          if (Array.isArray(dbUsers) && dbUsers.length > 0) {
            setRegisteredUsers(prev => {
              const prevMap = new Map(prev.map(u => [u.username.toLowerCase(), u]));
              dbUsers.forEach(u => {
                if (!prevMap.has(u.username.toLowerCase())) {
                  prevMap.set(u.username.toLowerCase(), {
                    username: u.username,
                    password: 'gov_password_2026', // Standard portal login for demo citizens
                    role: 'citizen',
                    name: u.full_name,
                    fields: { aadhaar: u.aadhaar_masked ? u.aadhaar_masked.replace(/X/g, '') || '1234' : '1234', phone: u.phone, email: u.email }
                  });
                }
              });
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync DB users on startup:', err);
      }
    };
    loadDbUsers();

    const loadDbApplications = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/applications');
        if (res.ok) {
          const dbApps = await res.json();
          if (Array.isArray(dbApps) && dbApps.length > 0) {
            setApplications(prev => {
              const prevMap = new Map(prev.map(a => [a.id, a]));
              dbApps.forEach(a => {
                prevMap.set(a.id, {
                  id: a.id,
                  name: a.name || 'Citizen',
                  service: a.service || 'Service Request',
                  timestamp: a.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
                  status: a.status || 'Pending',
                  language: a.language || 'English',
                  fields: a.fields || {},
                  attachments: a.attachments || [],
                  summary: a.summary || ''
                });
              });
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync DB applications on startup:', err);
      }
    };
    loadDbApplications();

    // Load audit ledger from DB on startup
    const loadDbLedger = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/ledger');
        if (res.ok) {
          const dbEntries = await res.json();
          if (Array.isArray(dbEntries) && dbEntries.length > 0) {
            setLedgerEntries(prev => {
              const prevMap = new Map(prev.map(e => [e.txId + e.event, e]));
              dbEntries.forEach(e => {
                const key = e.tx_id + e.event_type;
                if (!prevMap.has(key)) {
                  prevMap.set(key, {
                    txId: (e.details?.original_tx_id) || e.tx_id,
                    event: e.event_type,
                    dept: e.department,
                    timestamp: e.created_at,
                    hash: e.integrity_hash
                  });
                }
              });
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync DB ledger on startup:', err);
      }
    };
    loadDbLedger();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gov_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gov_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeView && activeView !== 'auth') {
      localStorage.setItem('gov_active_view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('gov_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('gov_ledger_entries', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  // Periodic check for token expiry
  useEffect(() => {
    const checkExpiry = () => {
      if (currentUser && currentUser.expiresAt && Date.now() > currentUser.expiresAt) {
        setCurrentUser(null);
        setActiveView('auth');
        localStorage.removeItem('gov_current_user');
        localStorage.removeItem('gov_active_view');
        addToast('Your session has expired. Please log in again.', 'error');
      }
    };
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [currentUser, addToast]);

  const handleNavigate = useCallback((view) => {
    if (soundEnabled) playSound('swoosh');

    if (view === 'landing') {
      setActiveView('landing');
      return;
    }

    // Role verification
    if (view === 'citizen') {
      if (currentUser && currentUser.role === 'citizen') {
        setActiveView('citizen');
      } else {
        setAuthTargetRole('citizen');
        setActiveView('auth');
      }
    } else if (view === 'officer') {
      if (currentUser && currentUser.role === 'officer') {
        setActiveView('officer');
      } else {
        setAuthTargetRole('officer');
        setActiveView('auth');
      }
    } else if (view === 'admin') {
      if (currentUser && currentUser.role === 'admin') {
        setActiveView('admin');
      } else {
        setAuthTargetRole('admin');
        setActiveView('auth');
      }
    }
  }, [currentUser, soundEnabled]);

  const handleRegisterUser = useCallback(async (newUser) => {
    setRegisteredUsers(prev => {
      if (prev.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) return prev;
      return [...prev, newUser];
    });

    // Persist registration directly to Backend Database & Supabase
    try {
      const payload = {
        username: newUser.username,
        full_name: newUser.name,
        phone: newUser.fields?.phone || '+91-9876543210',
        email: `${newUser.username}@citizen.gov.in`,
        preferred_language: 'en',
        aadhaar_masked: newUser.fields?.aadhaar ? `XXXXXXXX${newUser.fields.aadhaar.slice(-4)}` : 'XXXXXXXX1234',
        is_verified: true
      };
      await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Backend DB registration fallback to Supabase:', err);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ijgnkimiffbkszbpyavc.supabase.co';
        const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_oTelbOMXCrY3tdEAlrLwHw_m4IJopUd';
        await fetch(`${supabaseUrl}/rest/v1/citizens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            username: newUser.username,
            full_name: newUser.name,
            phone: newUser.fields?.phone || '+91-9876543210',
            email: `${newUser.username}@citizen.gov.in`,
            preferred_language: 'en',
            aadhaar_masked: newUser.fields?.aadhaar ? `XXXXXXXX${newUser.fields.aadhaar.slice(-4)}` : 'XXXXXXXX1234'
          })
        });
      } catch (e) {
        console.error('Failed to store registration in Supabase:', e);
      }
    }
  }, []);

  const handleLoginSuccess = useCallback((user) => {
    const authUser = {
      ...user,
      token: 'jwt_token_' + Math.random().toString(36).substring(2) + '_' + Date.now(),
      loginTime: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours TTL
    };
    setCurrentUser(authUser);
    setActiveView(authUser.role);
    localStorage.setItem('gov_active_view', authUser.role);
    localStorage.setItem('gov_current_user', JSON.stringify(authUser));
    addToast(`Welcome back, ${authUser.name}! Session restored.`, 'success');
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setActiveView('landing');
    localStorage.removeItem('gov_current_user');
    localStorage.removeItem('gov_active_view');
    if (soundEnabled) playSound('swoosh');
  }, [soundEnabled]);

  const handleHomeClick = useCallback(() => {
    if (currentUser) {
      // Show confirmation if user is logged in
      const confirmed = window.confirm(`You are logged in as ${currentUser.name}. Click OK to logout and return to Home, or Cancel to stay.`);
      if (confirmed) {
        handleLogout();
      }
    } else {
      handleNavigate('landing');
    }
  }, [currentUser, handleLogout, handleNavigate]);

  const handleAddApplication = useCallback((app) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newApp = { ...app, timestamp };
    setApplications(prev => [...prev, newApp])
    addToast(`New application submitted for ${app.service} (${app.id})!`, 'info');

    // Persist to officer_dashboard_tasks (flat table used by officer view)
    fetch('http://localhost:8000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    }).catch(err => console.warn('Failed to save application to officer_dashboard_tasks:', err));

    // Also persist to normalized service_requests + officer_tasks tables
    const dept = newApp.fields?.['Office Authority'] || newApp.fields?.['District / Mandal'] || 'Government Desk'
    fetch('http://localhost:8000/api/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_number: newApp.id,
        citizen_username: currentUser?.username || null,
        service_type: newApp.service,
        department: dept,
        status: 'SUBMITTED',
        form_data: newApp.fields || {},
        uploaded_documents: newApp.attachments || [],
        assigned_officer: 'officer'
      })
    }).catch(err => console.warn('Failed to save service_request to DB:', err));
  }, [addToast, currentUser])

  const handleAddLedgerEntry = useCallback((entry) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const hash = generateHash(entry.txId + entry.event + timestamp)
    const newEntry = { ...entry, timestamp, hash }
    setLedgerEntries(prev => [...prev, newEntry])

    // Persist to backend audit_ledger table
    fetch('http://localhost:8000/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEntry, details: { source: 'citizen_portal' } })
    }).catch(err => console.warn('Failed to save ledger entry to DB:', err))
  }, [])

  const handleUpdateStatus = useCallback((appId, newStatus) => {
    setApplications(prev => prev.map(app =>
      app.id === appId ? { ...app, status: newStatus } : app
    ))
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const hash = generateHash(appId + newStatus + timestamp)
    const ledgerEntry = {
      timestamp,
      txId: appId,
      event: `Status Updated: ${newStatus.toUpperCase()}`,
      dept: 'Officer Action',
      hash
    }
    setLedgerEntries(prev => [...prev, ledgerEntry])
    if (soundEnabled) playSound('success')
    addToast(`Application ${appId} status updated to ${newStatus.toUpperCase()}`, newStatus === 'Approved' ? 'success' : 'error');

    // Update flat officer_dashboard_tasks table
    fetch(`http://localhost:8000/api/applications/${encodeURIComponent(appId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(err => console.warn('Failed to update officer_dashboard_tasks status in DB:', err));

    // Update normalized service_requests + officer_tasks tables
    fetch(`http://localhost:8000/api/service-requests/${encodeURIComponent(appId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus.toUpperCase(),
        notes: `Officer action: ${newStatus} at ${timestamp}`,
        officer_username: currentUser?.username || 'officer'
      })
    }).catch(err => console.warn('Failed to update service_requests status in DB:', err));

    // Persist officer action to audit ledger
    fetch('http://localhost:8000/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txId: appId,
        event: `Status Updated: ${newStatus.toUpperCase()}`,
        dept: 'Officer Action',
        timestamp,
        hash,
        details: { officer: currentUser?.username || 'officer', new_status: newStatus }
      })
    }).catch(err => console.warn('Failed to save status-change ledger entry:', err));
  }, [soundEnabled, addToast, currentUser])

  const mergeApplicationsFromDB = useCallback((dbApps) => {
    setApplications(prev => {
      const prevMap = new Map(prev.map(a => [a.id, a]));
      dbApps.forEach(a => {
        prevMap.set(a.id, {
          id: a.id,
          name: a.name || 'Citizen',
          service: a.service || 'Service Request',
          timestamp: a.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: a.status || 'Pending',
          language: a.language || 'English',
          fields: a.fields || {},
          attachments: a.attachments || [],
          summary: a.summary || ''
        });
      });
      return Array.from(prevMap.values());
    });
  }, []);

  const handleRefreshDB = useCallback(async (silent = false) => {
    try {
      const res = await fetch('http://localhost:8000/api/applications');
      if (res.ok) {
        const dbApps = await res.json();
        if (Array.isArray(dbApps) && dbApps.length > 0) {
          mergeApplicationsFromDB(dbApps);
          if (!silent) addToast(`Synced ${dbApps.length} applications from Officer Database!`, 'success');
          return true;
        }
      }
      if (!silent) addToast('No new tasks found in Database.', 'info');
    } catch (err) {
      console.warn('Could not refresh DB applications:', err);
      if (!silent) addToast('Failed to connect to Officer Database.', 'error');
    }
    return false;
  }, [mergeApplicationsFromDB, addToast]);

  // Auto-sync: silently poll DB every 7s whenever officer/citizen/admin view is active
  useEffect(() => {
    if (!['officer', 'citizen', 'admin'].includes(activeView)) return;
    handleRefreshDB(true);
    const interval = setInterval(() => handleRefreshDB(true), 7000);
    return () => clearInterval(interval);
  }, [activeView, handleRefreshDB]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev)
  }, [])

  return (
    <div className="app-container">
      <ParticleBackground theme="dark" />

      {/* ═══════ HEADER ═══════ */}
      <header className="app-header">
        <div className="header-brand" onClick={() => handleNavigate('landing')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: 30, height: 30}}>
            <defs>
              <linearGradient id="headerGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#06b6d4"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#headerGrad)" fill="rgba(6,182,212,0.08)"/>
          </svg>
          <h1>Gov AI Copilot</h1>
        </div>

        <nav className="header-nav">
          <button className={`nav-btn ${activeView === 'landing' ? 'active' : ''}`} onClick={handleHomeClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>
          
          {currentUser && currentUser.role === 'citizen' && (
            <button className={`nav-btn ${activeView === 'citizen' ? 'active' : ''}`} onClick={() => handleNavigate('citizen')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Citizen Portal</span>
            </button>
          )}

          {currentUser && currentUser.role === 'officer' && (
            <button className={`nav-btn ${activeView === 'officer' ? 'active' : ''}`} onClick={() => handleNavigate('officer')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>Officer Desk</span>
            </button>
          )}

          {currentUser && currentUser.role === 'admin' && (
            <button className={`nav-btn ${activeView === 'admin' ? 'active' : ''}`} onClick={() => handleNavigate('admin')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Audit Ledger</span>
            </button>
          )}
        </nav>


        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {currentUser && (
            <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="panel-badge" style={{
                background: currentUser.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : currentUser.role === 'officer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--border-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: currentUser.role === 'admin' ? 'var(--accent-purple)' : currentUser.role === 'officer' ? 'var(--accent-blue)' : 'var(--accent-green)',
                textTransform: 'capitalize',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {currentUser.role === 'admin' ? 'Auditor' : currentUser.role}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {currentUser.name}
              </span>
              <button 
                onClick={handleLogout}
                className="icon-btn" 
                title="Log Out"
                style={{
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}

          <button className="icon-btn" onClick={toggleSound} title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}>
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="main-content">
        {activeView === 'landing' && (
          <LandingPortal onNavigate={handleNavigate} soundEnabled={soundEnabled} />
        )}
        {activeView === 'auth' && (
          <AuthPortal
            initialRole={authTargetRole}
            onLoginSuccess={handleLoginSuccess}
            registeredUsers={registeredUsers}
            onRegisterUser={handleRegisterUser}
            soundEnabled={soundEnabled}
          />
        )}
        {activeView === 'citizen' && (
          <CitizenPortal
            soundEnabled={soundEnabled}
            onAddApplication={handleAddApplication}
            onAddLedgerEntry={handleAddLedgerEntry}
            currentUser={currentUser}
            applications={applications}
          />
        )}
        {activeView === 'officer' && (
          <OfficerWorkstation
            soundEnabled={soundEnabled}
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onRefreshDB={handleRefreshDB}
            ledgerEntries={ledgerEntries}
          />
        )}
        {activeView === 'admin' && (
          <AdminLedger
            soundEnabled={soundEnabled}
            ledgerEntries={ledgerEntries}
            applications={applications}
          />
        )}
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <Footer
        onNavigate={handleNavigate}
        activeView={activeView}
        soundEnabled={soundEnabled}
        ledgerEntries={ledgerEntries}
      />

      {/* Floating Toast Notification Alerts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: `1px solid ${t.type === 'success' ? 'var(--accent-green)' : t.type === 'error' ? 'var(--accent-red)' : 'var(--accent-cyan)'}`,
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-elevated)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeInUp 0.3s ease',
              backdropFilter: 'blur(16px)'
            }}
          >
            <span>{t.type === 'success' ? '🟢' : t.type === 'error' ? '🔴' : '🔵'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
