import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonthList, useExpenses, useSettings } from '../hooks/useExpenses'
import HamburgerMenu from '../components/HamburgerMenu'

function formatMonthYear(monthYear) {
  const [year, month] = monthYear.split('-')
  const date = new Date(year, parseInt(month) - 1)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

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

function MonthDetail({ monthYear }) {
  const { expenses, loading, totals } = useExpenses(monthYear)
  const { pocketMoney } = useSettings()

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>
  }

  const netDue = pocketMoney + (totals.approvedExpenses - totals.totalCashIn)

  return (
    <div style={{ padding: '0 0 16px' }}>
      <div className="balance-card glass-card" style={{ margin: '0 0 12px' }}>
        <div className="balance-breakdown" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="breakdown-item">
            <span className="label">Pocket</span>
            <span className="value pocket">₹{pocketMoney.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Expenses</span>
            <span className="value expense">₹{totals.totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Cash In</span>
            <span className="value cash-in">₹{totals.totalCashIn.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Net Due</span>
            <span className="value pocket">₹{netDue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {expenses.map((exp) => (
        <div key={exp.id} className="review-item glass-card" style={{ marginBottom: '6px' }}>
          <div className="review-info">
            <div className={`amount type-${exp.type}`}>
              {exp.type === 'cash_in' ? '+' : ''}₹{exp.amount.toLocaleString('en-IN')}
            </div>
            {exp.description && <div className="desc">{exp.description}</div>}
            <div className="time">{formatTime(exp.created_at)}</div>
          </div>
          <span className={`review-status-badge ${exp.status}`}>
            {exp.status}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function History() {
  const { months, loading } = useMonthList()
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1>History</h1>
        </div>
        <HamburgerMenu />
      </div>

      <div className="history-list">
        {months.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <div className="title">No past months</div>
            <div className="subtitle">Previous months will appear here</div>
          </div>
        ) : (
          months.map((m) => (
            <div key={m}>
              <div
                className="history-month-card glass-card"
                onClick={() => setExpanded(expanded === m ? null : m)}
              >
                <div className="month-title">
                  {expanded === m ? '▾' : '▸'} {formatMonthYear(m)}
                </div>
              </div>
              {expanded === m && <MonthDetail monthYear={m} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
