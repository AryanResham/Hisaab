import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function HamburgerMenu({ onEditPocketMoney }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const isReviewer = profile?.role === 'reviewer'

  function close() {
    setIsOpen(false)
  }

  function handleMenuAction(action) {
    close()
    if (action === 'history') navigate('/history')
    else if (action === 'dashboard') navigate('/dashboard')
    else if (action === 'review') navigate('/review')
    else if (action === 'pocket') onEditPocketMoney?.()
  }

  async function handleSignOut() {
    setConfirmSignOut(false)
    await signOut()
  }

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        id="hamburger-btn"
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isOpen && <div className="menu-backdrop" onClick={close} />}

      <div className={`slide-menu glass-card ${isOpen ? 'open' : ''}`}>
        {/* Header with close button */}
        <div className="menu-header">
          <div>
            <div className="menu-user-name">{profile?.name || 'User'}</div>
            <div className="menu-user-role">{isReviewer ? 'Reviewer' : 'Member'}</div>
          </div>
          <button className="menu-close-btn" onClick={close} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="menu-items">
          {location.pathname !== '/dashboard' && (
            <button className="menu-item" onClick={() => handleMenuAction('dashboard')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span>Dashboard</span>
            </button>
          )}

          {isReviewer && location.pathname !== '/review' && (
            <button className="menu-item" onClick={() => handleMenuAction('review')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Review</span>
            </button>
          )}

          <button className="menu-item" onClick={() => handleMenuAction('history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>History</span>
          </button>

          {isReviewer && onEditPocketMoney && (
            <button className="menu-item" onClick={() => handleMenuAction('pocket')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Edit Pocket Money</span>
            </button>
          )}

          <button className="menu-item signout-btn" onClick={() => { close(); setConfirmSignOut(true) }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sign out confirmation popup */}
      {confirmSignOut && (
        <div className="modal-overlay" onClick={() => setConfirmSignOut(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h3>Sign out?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '8px 0 20px' }}>
              You'll need to sign in again to access Hisaab.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmSignOut(false)}>Cancel</button>
              <button className="btn-save" style={{ background: 'var(--accent-red)' }} onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
