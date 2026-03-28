import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (selectedRole === 'reviewer') {
          if (inviteCode !== import.meta.env.VITE_REVIEWER_CODE) {
            setError('Invalid reviewer code')
            setLoading(false)
            return
          }
        }
        await signUp(email, password, name, selectedRole)
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

            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'member' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('member'); setInviteCode('') }}
              >
                Member
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'reviewer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('reviewer')}
              >
                Reviewer
              </button>
            </div>

            {selectedRole === 'reviewer' && (
              <input
                className="form-input"
                type="text"
                placeholder="Reviewer code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            )}
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
          <span onClick={() => { setIsSignUp(!isSignUp); setError(''); setSelectedRole('member'); setInviteCode('') }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </form>
    </div>
  )
}
