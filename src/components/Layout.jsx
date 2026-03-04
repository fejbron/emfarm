import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useFarm } from '../context/FarmContext'
import {
    LayoutDashboard,
    Egg,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    Menu,
    X,
    Search
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
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { state } = useFarm()
    const location = useLocation()

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
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                    {navItems.map(item => (
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
                    ))}
                </nav>

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
                    <div className="topbar-user">
                        <div className="topbar-user-info">
                            <div className="user-name">{state.settings.farmName}</div>
                            <div className="user-role">Admin</div>
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
