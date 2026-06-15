import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setError('')

        axios.post('/users/register', { email, password })
            .then((res) => {
                localStorage.setItem('token', res.data.token)
                if (res.data.refreshToken) {
                    localStorage.setItem('refreshToken', res.data.refreshToken)
                }
                setUser(res.data.user)
                navigate('/landing')   // ← landing page after register
            })
            .catch((err) => {
                const responseError =
                    err.response?.data?.error ||
                    err.response?.data?.errors?.[0]?.msg ||
                    err.message ||
                    'Unable to register. Please try again.'
                console.error(responseError, err)
                setError(responseError)
            })
    }

    return (
        <div className="lp-auth-root">
            <div className="lp-auth-card">
                {/* logo */}
                <div className="lp-auth-logo">
                    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                        <defs>
                            <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7C3AED" />
                                <stop offset="100%" stopColor="#A78BFA" />
                            </linearGradient>
                        </defs>
                        <rect width="40" height="40" rx="12" fill="url(#ag2)" />
                        <path d="M8 11h24a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H22l-6 6v-6H8a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="white" opacity="0.95" />
                    </svg>
                    <span className="lp-brand-name">iMessage</span>
                </div>

                <h2 className="lp-auth-title">Create account</h2>
                <p className="lp-auth-sub">Join your team on iMessage</p>

                <form onSubmit={submitHandler} className="lp-auth-form">
                    {error && <div className="im-error-bar"><span>⚠ {error}</span></div>}

                    <div className="im-form-group">
                        <label className="im-label" htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="im-input"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="im-form-group">
                        <label className="im-label" htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="im-input"
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="im-btn-primary lp-auth-submit">
                        Create account →
                    </button>
                </form>

                <p className="lp-auth-footer">
                    Already have an account?{' '}
                    <Link to="/login" className="lp-auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    )
}

export default Register