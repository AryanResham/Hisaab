import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, name, role)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-logo">Hisaab</div>
      <p className="login-subtitle">Family expense tracker</p>

      <form className="login-form" onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <input
              id="name-input"
              className="form-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`filter-tab ${role === 'member' ? 'active' : ''}`}
                onClick={() => setRole('member')}
                style={{ flex: 1 }}
              >
                👤 Member
              </button>
              <button
                type="button"
                className={`filter-tab ${role === 'reviewer' ? 'active' : ''}`}
                onClick={() => setRole('reviewer')}
                style={{ flex: 1 }}
              >
                👩 Reviewer (Mom)
              </button>
            </div>
          </>
        )}

        <input
          id="email-input"
          className="form-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="password-input"
          className="form-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <div className="login-error">{error}</div>}

        <button
          id="login-btn"
          className="login-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p className="login-toggle">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => { setIsSignUp(!isSignUp); setError('') }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </form>
    </div>
  )
}
