import { useState, useMemo } from 'react';
import { playSound } from '../utils/soundEngine';

export default function AdminLedger({ soundEnabled, ledgerEntries, applications }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = useMemo(() => {
    const depts = new Set(ledgerEntries.map(e => e.dept));
    return ['all', ...Array.from(depts)];
  }, [ledgerEntries]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.dept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'all' || entry.dept === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [ledgerEntries, searchQuery, deptFilter]);

  const stats = useMemo(() => ({
    totalTx: ledgerEntries.length,
    departments: new Set(ledgerEntries.map(e => e.dept)).size,
    integrity: '100%'
  }), [ledgerEntries]);

  return (
    <section className="workspace-view" id="viewAdmin">
      <div className="admin-grid">

        {/* Stats */}
        <div className="stats-bar fade-in-up" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card glass-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="stat-value">{stats.totalTx}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div className="stat-value">{stats.departments}</div>
            <div className="stat-label">Departments Covered</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="stat-value">{stats.integrity}</div>
            <div className="stat-label">Integrity Score</div>
          </div>
        </div>

        {/* Filters + Audit Table */}
        <div className="glass-panel fade-in-up">
          <div className="panel-header">
            <div className="header-left">
              <span className="panel-badge purple">Audit Trail</span>
              <h3>Transaction Ledger</h3>
            </div>
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>{filteredEntries.length} records</span>
          </div>

          <div style={{ padding: '16px 20px 0' }}>
            <div className="filter-bar">
              <input
                type="text"
                className="filter-input"
                placeholder="Search by TX ID, event, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="filter-select"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); if (soundEnabled) playSound('click'); }}
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrapper" style={{ margin: '16px 20px 20px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Transaction ID</th>
                  <th>Event</th>
                  <th>Department</th>
                  <th>Hash Signature</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {entry.timestamp}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {entry.txId}
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{entry.event}</td>
                    <td>
                      <span className="panel-badge blue">{entry.dept}</span>
                    </td>
                    <td className="hash-cell">
                      {entry.hash ? entry.hash.substring(0, 12) + '...' : '—'}
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
