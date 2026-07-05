import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { playSound } from '../utils/soundEngine';

export default function AuthPortal({ 
  initialRole = 'citizen', 
  onLoginSuccess, 
  registeredUsers, 
  onRegisterUser, 
  soundEnabled 
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const role = initialRole;

  // Input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [department, setDepartment] = useState('Transport Desk');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const triggerSound = (type) => {
    if (soundEnabled) playSound(type);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    triggerSound('click');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage(t('auth.noCredentials'));
      triggerSound('click');
      return;
    }

    // Authenticate
    const user = registeredUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.role === role
    );

    if (!user) {
      setErrorMessage(`${t('auth.noUser')} (${role}).`);
      triggerSound('click');
      return;
    }

    if (user.password !== password) {
      setErrorMessage(t('auth.wrongPassword'));
      triggerSound('click');
      return;
    }

    triggerSound('success');
    onLoginSuccess(user);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password || !confirmPassword || !fullName.trim()) {
      setErrorMessage(t('auth.requiredFields'));
      triggerSound('click');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.passwordMismatch'));
      triggerSound('click');
      return;
    }

    if (password.length < 4) {
      setErrorMessage(t('auth.passwordShort'));
      triggerSound('click');
      return;
    }

    // Check duplicate
    const exists = registeredUsers.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.role === role
    );

    if (exists) {
      setErrorMessage(t('auth.usernameTaken'));
      triggerSound('click');
      return;
    }

    // Form schema
    const newUser = {
      username: username.trim(),
      password: password,
      role: role,
      name: fullName.trim(),
      fields: {}
    };

    if (role === 'citizen') {
      if (!aadhaarNumber.trim() || aadhaarNumber.trim().length !== 12) {
        setErrorMessage(t('auth.aadhaarInvalid'));
        triggerSound('click');
        return;
      }
      newUser.fields.aadhaar = aadhaarNumber.trim();
    } else if (role === 'officer') {
      if (!officerId.trim()) {
        setErrorMessage(t('auth.officerIdRequired'));
        triggerSound('click');
        return;
      }
      newUser.fields.officerId = officerId.trim();
      newUser.fields.department = department;
    }

    onRegisterUser(newUser);
    setSuccessMessage(t('auth.regSuccess'));
    triggerSound('success');

    // Switch to login tab and keep values for convenience
    setActiveTab('login');
    setPassword('');
    setConfirmPassword('');
  };

  const handleAutofillDemo = () => {
    triggerSound('click');
    setErrorMessage('');
    setSuccessMessage('');

    if (role === 'citizen') {
      setUsername('citizen');
      setPassword('citizen123');
    } else if (role === 'officer') {
      setUsername('officer');
      setPassword('govcopilot2026');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '20px 0' }}>
      <div className="glass-panel fade-in-up" style={{ width: '100%', maxWidth: '480px', padding: '36px 32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border-primary)' }}>

        {/* Tab Toggle Login / Register */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', pb: 8 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {role === 'admin' ? t('auth.auditorAuth') : role === 'officer' ? t('auth.officerWorkstation') : t('auth.citizenWorkspace')}
          </h2>
          {role !== 'admin' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <span
                onClick={() => handleTabChange('login')}
                style={{
                  fontSize: '0.88rem',
                  fontWeight: activeTab === 'login' ? 600 : 400,
                  color: activeTab === 'login' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'login' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  paddingBottom: 4
                }}
              >
                {t('auth.signIn')}
              </span>
              <span
                onClick={() => handleTabChange('register')}
                style={{
                  fontSize: '0.88rem',
                  fontWeight: activeTab === 'register' ? 600 : 400,
                  color: activeTab === 'register' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'register' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  paddingBottom: 4
                }}
              >
                {t('auth.register')}
              </span>
            </div>
          )}
        </div>

        {successMessage && (
          <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', borderLeft: '3px solid var(--accent-green)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-green)', fontSize: '0.82rem', marginBottom: 18 }}>
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', borderLeft: '3px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: '0.82rem', marginBottom: 18 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Auth Forms */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.username')}</label>
              <input
                type="text"
                className="form-select-sm"
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', height: '40px' }}
                placeholder={`Enter your ${role} username`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.password')}</label>
              <input
                type="password"
                className="form-select-sm"
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', height: '40px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="launch-btn primary-btn"
              style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.92rem', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              {t('auth.signInBtn')}
            </button>

            <button
              type="button"
              onClick={handleAutofillDemo}
              className="launch-btn secondary-btn"
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <span>⚡</span> {t('auth.autofillDemo')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.fullName')}</label>
              <input
                type="text"
                className="form-select-sm"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                placeholder="Enter your display name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.username')}</label>
              <input
                type="text"
                className="form-select-sm"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                placeholder="Create username for login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {role === 'citizen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.aadhaar')}</label>
                <input
                  type="text"
                  maxLength="12"
                  className="form-select-sm"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                  placeholder="e.g. 123456789012"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            )}

            {role === 'officer' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.officerId')}</label>
                  <input
                    type="text"
                    className="form-select-sm"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                    placeholder="e.g. OFF-8821"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.department')}</label>
                  <select
                    className="form-select-sm"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Transport Desk">Transport Desk (Driving License)</option>
                    <option value="Agriculture Desk">Agriculture Desk (Crop Subsidy / Rythu Bandhu)</option>
                    <option value="Municipal Desk">Municipal Desk (Birth & Death Registration)</option>
                    <option value="UIDAI Desk">UIDAI Desk (Aadhaar Updates)</option>
                    <option value="Revenue Desk">Revenue Desk (PAN Cards, Income & Caste Certificates)</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.password')}</label>
              <input
                type="password"
                className="form-select-sm"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('auth.confirmPassword')}</label>
              <input
                type="password"
                className="form-select-sm"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="launch-btn primary-btn"
              style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.9rem', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              {t('auth.registerBtn')}
            </button>
          </form>
        )}

        {/* Demo Info details block */}
        <div style={{ marginTop: '24px', padding: '12px 14px', background: 'rgba(6, 182, 212, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t('auth.demoCreds')}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {role === 'citizen' && <span><strong>Citizen</strong>: citizen / citizen123</span>}
            {role === 'officer' && <span><strong>Officer</strong>: officer / govcopilot2026</span>}
            {role === 'admin' && <span><strong>Auditor</strong>: admin / admin123</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
