import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useFarm } from '../context/FarmContext'
import { supabase } from '../supabase'
import {
    LayoutDashboard,
    Egg,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    Menu,
    X,
    Search,
    LogOut,
    MapPin
} from 'lucide-react'

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/collection', label: 'Egg Collection', icon: Egg },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
    { path: '/expenses', label: 'Expenses', icon: Wallet },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings }
]

const pageTitles = {
    '/': 'Dashboard',
    '/collection': 'Egg Collection',
    '/sales': 'Sales',
    '/expenses': 'Expenses',
    '/reports': 'Reports',
    '/settings': 'Settings'
}

export default function Layout({ children }) {
    const { state, dispatch } = useFarm()
    const { settings, profile, user } = state
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    const handleLogOut = async () => {
        if (state.isSupabase !== false) {
            await supabase.auth.signOut()
        }
        dispatch({ type: 'SIGN_OUT' })
    }

    const initials = state.settings.farmName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const currentTitle = pageTitles[location.pathname] || 'Dashboard'

    return (
        <div className="app-layout">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div
                className={`sidebar - overlay ${sidebarOpen ? 'open' : ''} `}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} `}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">🥚</div>
                        <div>
                            <h1>EggLedger</h1>
                            <span>Farm Tracker</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        if (item.path === '/settings' && profile?.role !== 'super_admin') return null
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </nav>

                {user && (
                    <div style={{ padding: '0 var(--space-md) var(--space-md) var(--space-md)', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 14px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--font-sm)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-primary)' }}>
                                    {profile?.full_name || 'User'}
                                </p>
                                <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                    {profile?.role?.replace('_', ' ') || 'owner'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogOut}
                            className="nav-link"
                            style={{ width: '100%', background: 'none' }}
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}

                <div className="sidebar-footer">
                    <div className="farm-info">
                        <div className="farm-avatar">{initials}</div>
                        <div>
                            <div className="farm-name">{state.settings.farmName}</div>
                            <div className="farm-sub">{state.collections.length} records</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Topbar */}
            <div className="topbar">
                <div className="topbar-left">
                    <h2>{currentTitle}</h2>
                    <div className="topbar-search">
                        <Search size={16} />
                        <input type="text" placeholder="Search here..." />
                    </div>
                </div>
                <div className="topbar-right">
                    <div className="topbar-env" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'var(--space-md)', background: 'var(--bg-input)', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <MapPin size={16} className="text-muted" />
                        <select 
                            className="form-select" 
                            style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 500, fontSize: 'var(--font-sm)', width: 'auto', outline: 'none', cursor: 'pointer' }}
                            value={state.activePen}
                            onChange={(e) => dispatch({ type: 'SET_ACTIVE_PEN', payload: e.target.value })}
                            disabled={!!profile?.assigned_pen}
                        >
                            {profile?.assigned_pen ? (
                                <option value={profile.assigned_pen}>{profile.assigned_pen}</option>
                            ) : (
                                <>
                                    <option value="all">All Pens</option>
                                    <option value="Emeline's Pen">Emeline's Pen</option>
                                    <option value="Dorcas' Pen">Dorcas' Pen</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="topbar-user">
                        <div className="user-profile">
                            <span className="user-avatar">
                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || '👤')}
                            </span>
                            <span className="user-name">{profile?.full_name || 'Farm User'} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '4px' }}>• {profile?.role?.replace('_', ' ') || 'owner'}</span></span>
                        </div>
                        <div className="topbar-avatar">{initials}</div>
                    </div>
                </div>
            </div>

            <main className="main-content">
                <div className="animate-in" key={location.pathname}>
                    {children}
                </div>
            </main>
        </div>
    )
}
