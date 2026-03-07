import { useState } from 'react'
import { supabase } from '../supabase'
import { Egg } from 'lucide-react'

export default function Login() {
    const [isLogin, setIsLogin] = useState(true)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: 'https://emfarm-beta.vercel.app/reset-password',
                })
                if (error) throw error
                setMessage('Check your email for the password reset link.')
            } else if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                })
                if (error) throw error
                // In Supabase, sign up might require email confirmation depending on settings
                // But for standard setup, it logs them in automatically if confirmation is off
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (isForgotPassword) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: 'var(--space-md)' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Egg size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reset Password</h2>
                        <p className="text-muted">Enter your email to receive a reset link</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)' }}>
                                {error}
                            </div>
                        )}
                        {message && (
                            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)' }}>
                                {message}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsForgotPassword(false)
                                setError(null)
                                setMessage(null)
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 500 }}
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: 'var(--space-md)' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Egg size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>EggLedger</h2>
                    <p className="text-muted">Poultry Farm Tracker</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)' }}>
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={!isLogin}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <label style={{ marginBottom: 0 }}>Password</label>
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(true)
                                        setError(null)
                                        setMessage(null)
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'var(--font-sm)', padding: 0 }}
                                >
                                    Forgot Password?
                                </button>
                            )}
                        </div>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError(null)
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 500 }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    )
}
