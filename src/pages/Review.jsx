import { useState } from 'react'
import { useExpenses, useSettings } from '../hooks/useExpenses'
import HamburgerMenu from '../components/HamburgerMenu'

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function Review() {
  const { expenses, loading, totals, updateExpenseStatus } = useExpenses()
  const { pocketMoney } = useSettings()
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleApprove(id) {
    try {
      await updateExpenseStatus(id, 'approved')
      showToast('Approved ✓')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function openRejectModal(expense) {
    setRejectModal(expense)
    setRejectReason('')
  }

  async function handleReject() {
    if (!rejectModal) return
    try {
      await updateExpenseStatus(rejectModal.id, 'rejected', rejectReason || null)
      setRejectModal(null)
      showToast('Rejected ✗')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filtered = expenses.filter((exp) => {
    if (filter === 'all') return true
    return exp.status === filter
  })

  const runningBalance = totals.totalExpenses - totals.totalCashIn
  const netDue = pocketMoney + runningBalance

  // For reviewer: show approved-based net
  const approvedBalance = totals.approvedExpenses - totals.totalCashIn
  const approvedNetDue = pocketMoney + approvedBalance

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="page">
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="page-header">
        <h1>Review</h1>
        <HamburgerMenu />
      </div>

      {/* Pocket Money Row */}
      <div className="pocket-money-row">
        <span className="label">Pocket Money</span>
        <span className="value">₹{pocketMoney.toLocaleString('en-IN')}</span>
      </div>

      {/* Summary Card */}
      <div className="balance-card glass-card">
        <div className="balance-label">Net Due (Approved Only)</div>
        <div className={`balance-amount ${approvedNetDue >= 0 ? 'positive' : ''}`}>
          ₹{approvedNetDue.toLocaleString('en-IN')}
        </div>
        <div className="balance-breakdown">
          <div className="breakdown-item">
            <span className="label">Approved</span>
            <span className="value expense">₹{totals.approvedExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Pending</span>
            <span className="value" style={{ color: 'var(--accent-yellow)' }}>
              ₹{totals.pendingExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="breakdown-item">
            <span className="label">Cash In</span>
            <span className="value cash-in">₹{totals.totalCashIn.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'rejected' && totals.rejectedExpenses > 0 && (
              <span style={{ marginLeft: '4px' }}>
                ({expenses.filter(e => e.status === 'rejected').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="review-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              {filter === 'pending' ? '✅' : '📋'}
            </div>
            <div className="title">
              {filter === 'pending' ? 'All caught up!' : `No ${filter} expenses`}
            </div>
          </div>
        ) : (
          filtered.map((exp) => (
            <div key={exp.id} className="review-item glass-card">
              <div className="review-info">
                <div className={`amount type-${exp.type}`}>
                  {exp.type === 'cash_in' ? '+' : ''}₹{exp.amount.toLocaleString('en-IN')}
                </div>
                {exp.description && <div className="desc">{exp.description}</div>}
                <div className="time">{formatTime(exp.created_at)}</div>
                {exp.status === 'rejected' && exp.rejection_reason && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-red)',
                    marginTop: '4px',
                    fontStyle: 'italic',
                  }}>
                    Reason: {exp.rejection_reason}
                  </div>
                )}
              </div>

              {exp.status === 'approved' ? (
                <button
                  className="action-btn reject"
                  onClick={() => openRejectModal(exp)}
                  title="Reject"
                >
                  ✕
                </button>
              ) : (
                <div className="review-actions">
                  <button
                    className="action-btn approve"
                    onClick={() => handleApprove(exp.id)}
                    title="Restore"
                  >
                    ✓
                  </button>
                  <span className={`review-status-badge ${exp.status}`}>
                    {exp.status}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Expense</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              ₹{rejectModal.amount} — {rejectModal.description || 'No description'}
            </p>
            <input
              className="form-input"
              type="text"
              placeholder="Reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn-save"
                onClick={handleReject}
                style={{ background: 'var(--accent-red)' }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
