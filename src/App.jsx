import { Routes, Route, Navigate } from 'react-router-dom'
import { useFarm } from './context/FarmContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import EggCollection from './pages/EggCollection'
import Sales from './pages/Sales'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'

export default function App() {
    const { state } = useFarm()

    // Show loading spinner while checking auth state
    if (state.loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // If not logged in, only show the Login page
    if (!state.user && state.isSupabase !== false) {
        return <Login />
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/collection" element={<EggCollection />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    )
}

