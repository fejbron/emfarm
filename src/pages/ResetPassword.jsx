import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Egg } from 'lucide-react'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) throw error
            setMessage('Password updated successfully. Redirecting to dashboard...')
            setTimeout(() => {
                navigate('/')
            }, 2000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Egg size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Set New Password</h2>
                    <p className="text-muted">EggLedger Tracker</p>
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
                        <label>New Password</label>
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
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
