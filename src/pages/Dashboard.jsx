import { useState, useRef, useEffect } from 'react'
import { useExpenses, useSettings } from '../hooks/useExpenses'
import { parseExpense } from '../lib/parser'
import HamburgerMenu from '../components/HamburgerMenu'

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { expenses, loading, totals, addExpense, deleteExpense } = useExpenses()
  const { pocketMoney, updatePocketMoney } = useSettings()
  const [input, setInput] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)
  const [toast, setToast] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [newPocketMoney, setNewPocketMoney] = useState(pocketMoney)
  const listRef = useRef(null)

  useEffect(() => {
    setNewPocketMoney(pocketMoney)
  }, [pocketMoney])

  // Scroll to bottom when expenses change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [expenses])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSend() {
    if (!input.trim()) return

    const parsed = parseExpense(input)
    if (parsed.error) {
      showToast(parsed.error, 'error')
      return
    }

    try {
      await addExpense(parsed.amount, parsed.description, parsed.type)
      setInput('')
      showToast(
        parsed.type === 'cash_in'
          ? `+₹${parsed.amount} cash received`
          : `₹${parsed.amount} added`
      )
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id)
      showToast('Deleted')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSavePocketMoney() {
    try {
      await updatePocketMoney(parseInt(newPocketMoney, 10))
      setShowSettings(false)
      showToast('Pocket money updated')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const runningBalance = totals.approvedExpenses - totals.totalCashIn
  const netDue = pocketMoney + runningBalance

  // Group expenses by date
  const grouped = expenses.reduce((acc, exp) => {
    const dateKey = formatDate(exp.created_at)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(exp)
    return acc
  }, {})

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
        <h1>Hisaab</h1>
        <HamburgerMenu onEditPocketMoney={() => setShowSettings(true)} />
      </div>

      {/* Balance Card */}
      <div className="balance-card glass-card">
        <div className="balance-label">Net Due This Month</div>
        <div className={`balance-amount ${netDue >= 0 ? 'positive' : ''}`}>
          ₹{netDue.toLocaleString('en-IN')}
        </div>
        <div className="balance-breakdown">
          <div className="breakdown-item">
            <span className="label">Pocket</span>
            <span className="value pocket">₹{pocketMoney.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Expenses</span>
            <span className="value expense">₹{totals.approvedExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Cash In</span>
            <span className="value cash-in">₹{totals.totalCashIn.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="expense-list" ref={listRef}>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <div className="title">No expenses yet</div>
            <div className="subtitle">Type below to add your first expense</div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                padding: '8px 0',
                fontWeight: 500,
              }}>
                {date}
              </div>
              {items.map((exp) => (
                <div
                  key={exp.id}
                  className={`expense-bubble type-${exp.type}`}
                  style={{ marginBottom: '8px' }}
                >
                  {exp.status === 'pending' && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(exp.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                  <div className="bubble-amount">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                  {exp.description && (
                    <div className="bubble-desc">{exp.description}</div>
                  )}
                  <div className="bubble-meta">
                    <span className="bubble-time">{formatTime(exp.created_at)}</span>
                    <span className={`bubble-status ${exp.status}`}>
                      {exp.status}
                    </span>
                  </div>
                  {exp.status === 'rejected' && exp.rejection_reason && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-red)',
                      marginTop: '4px',
                      fontStyle: 'italic',
                    }}>
                      "{exp.rejection_reason}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Syntax Tooltip */}
      {showTooltip && (
        <div className="syntax-tooltip glass-card">
          <h4>How to add</h4>
          <div className="syntax-example">
            <code>600 mushroom, eggs</code>
            <span className="arrow">→</span>
            <span className="result">₹600 expense</span>
          </div>
          <div className="syntax-example">
            <code>samaan 1000rs</code>
            <span className="arrow">→</span>
            <span className="result">₹1000 expense</span>
          </div>
          <div className="syntax-example">
            <code>+500 dad gave</code>
            <span className="arrow">→</span>
            <span className="result">₹500 cash in</span>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="input-bar">
        <button
          className={`tooltip-btn ${showTooltip ? 'active' : ''}`}
          onClick={() => setShowTooltip(!showTooltip)}
          id="tooltip-btn"
        >
          ?
        </button>
        <input
          id="expense-input"
          type="text"
          placeholder="Enter Amount and description"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          id="send-btn"
        >
          ↑
        </button>
      </div>

      {/* Pocket Money Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <h3>Pocket Money</h3>
            <input
              id="pocket-money-input"
              className="form-input"
              type="number"
              value={newPocketMoney}
              onChange={(e) => setNewPocketMoney(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSavePocketMoney}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
