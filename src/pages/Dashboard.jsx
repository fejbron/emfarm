import { useMemo } from 'react'
import { useFarm } from '../context/FarmContext'
import {
    Egg,
    Package,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Wallet,
    Home
} from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function getDateStr(d = new Date()) {
    return d.toISOString().split('T')[0]
}

function getLast7Days() {
    const days = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(getDateStr(d))
    }
    return days
}

function formatShortDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
    const { state } = useFarm()
    const { collections, sales, expenses, settings, activePen } = state
    const today = getDateStr()
    const currency = settings.currency

    const filterByActivePen = (item) => {
        if (activePen === 'all') return true
        if (item.house === activePen) return true
        if (activePen === "Emeline's Pen" && String(item.house) === '1') return true
        if (activePen === "Dorcas' Pen" && String(item.house) === '2') return true
        return false
    }

    const stats = useMemo(() => {
        const activeCollections = collections.filter(filterByActivePen)
        const activeSales = sales.filter(filterByActivePen)
        const activeExpenses = expenses.filter(filterByActivePen)

        const todayCollections = activeCollections.filter(c => c.date === today)
        const todayEggs = todayCollections.reduce((s, c) => s + Number(c.eggs), 0)
        const todayCrates = Number(todayCollections.reduce((s, c) => s + Number(c.crates), 0).toFixed(2))
        const todayDamaged = todayCollections.reduce((s, c) => s + Number(c.damagedEggs || 0), 0)

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const monthSales = activeSales.filter(s => new Date(s.date + 'T00:00:00') >= monthStart)
        const monthRevenue = monthSales.reduce((s, sl) => s + Number(sl.totalAmount), 0)

        const monthExpenses = activeExpenses
            .filter(e => new Date(e.date + 'T00:00:00') >= monthStart)
            .reduce((s, e) => s + Number(e.amount), 0)

        const monthProfit = monthRevenue - monthExpenses

        const totalCratesCollected = activeCollections.reduce((s, c) => s + Number(c.crates), 0)
        const totalCratesSold = activeSales.reduce((s, sl) => s + Number(sl.cratesSold), 0)
        const stockCrates = Number((totalCratesCollected - totalCratesSold).toFixed(2))

        const emelineColls = collections.filter(c => c.house === "Emeline's Pen" || String(c.house) === '1')
        const emelineSalesData = sales.filter(s => s.house === "Emeline's Pen" || String(s.house) === '1')
        const emelineStock = Number((emelineColls.reduce((s, c) => s + Number(c.crates), 0) - emelineSalesData.reduce((s, sl) => s + Number(sl.cratesSold), 0)).toFixed(2))

        const dorcasColls = collections.filter(c => c.house === "Dorcas' Pen" || String(c.house) === '2')
        const dorcasSalesData = sales.filter(s => s.house === "Dorcas' Pen" || String(s.house) === '2')
        const dorcasStock = Number((dorcasColls.reduce((s, c) => s + Number(c.crates), 0) - dorcasSalesData.reduce((s, sl) => s + Number(sl.cratesSold), 0)).toFixed(2))

        const pendingPayments = activeSales
            .filter(s => s.paymentStatus !== 'paid')
            .reduce((sum, s) => sum + Number(s.totalAmount), 0)

        const todayExpenses = activeExpenses
            .filter(e => e.date === today)
            .reduce((s, e) => s + Number(e.amount), 0)

        return { todayEggs, todayCrates, todayDamaged, monthRevenue, monthExpenses, monthProfit, stockCrates, emelineStock, dorcasStock, pendingPayments, todayExpenses }
    }, [collections, sales, expenses, today, activePen])

    const chartData = useMemo(() => {
        const activeCollections = collections.filter(filterByActivePen)
        const activeSales = sales.filter(filterByActivePen)
        const activeExpenses = expenses.filter(filterByActivePen)

        const days = getLast7Days()
        return days.map(day => {
            const dayCollections = activeCollections.filter(c => c.date === day)
            const daySales = activeSales.filter(s => s.date === day)
            const dayExpenses = activeExpenses.filter(e => e.date === day)
            return {
                name: formatShortDate(day),
                eggs: dayCollections.reduce((s, c) => s + Number(c.eggs), 0),
                revenue: daySales.reduce((s, sl) => s + Number(sl.totalAmount), 0),
                expenses: dayExpenses.reduce((s, e) => s + Number(e.amount), 0)
            }
        })
    }, [collections, sales, expenses, activePen])

    const recentActivity = useMemo(() => {
        const activeCollections = collections.filter(filterByActivePen)
        const activeSales = sales.filter(filterByActivePen)
        const activeExpenses = expenses.filter(filterByActivePen)

        const items = [
            ...activeCollections.slice(0, 4).map(c => ({
                type: 'collection',
                title: `Collected ${c.crates} crate${c.crates > 1 ? 's' : ''} (${c.eggs} eggs) — ${c.house || "Emeline's Pen"}`,
                date: c.date,
                amount: c.damagedEggs > 0 ? `${c.damagedEggs} damaged` : null,
                amountClass: 'text-danger',
                id: c.id
            })),
            ...activeSales.slice(0, 4).map(s => ({
                type: 'sale',
                title: `Sold ${s.cratesSold} crate${s.cratesSold > 1 ? 's' : ''} to ${s.customerName}`,
                date: s.date,
                amount: `${currency}${Number(s.totalAmount).toLocaleString()}`,
                amountClass: 'text-success',
                id: s.id
            })),
            ...activeExpenses.slice(0, 4).map(e => ({
                type: 'expense',
                title: `${e.category}: ${e.description || 'Expense'}`,
                date: e.date,
                amount: `-${currency}${Number(e.amount).toLocaleString()}`,
                amountClass: 'text-danger',
                id: e.id
            }))
        ]
        items.sort((a, b) => b.id - a.id)
        return items.slice(0, 10)
    }, [collections, sales, expenses, currency, activePen])

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your poultry farm performance</p>
            </div>

            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon amber"><Egg size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.todayEggs.toLocaleString()}</h3>
                        <p>Eggs Today</p>
                        <div className="stat-trend up">
                            {stats.todayCrates} crate{stats.todayCrates !== 1 ? 's' : ''}
                            {stats.todayDamaged > 0 && <span style={{ color: 'var(--danger)', marginLeft: '6px' }}>({stats.todayDamaged} damaged)</span>}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.monthRevenue.toLocaleString()}</h3>
                        <p>Revenue This Month</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red"><Wallet size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.monthExpenses.toLocaleString()}</h3>
                        <p>Expenses This Month</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className={`stat-icon ${stats.monthProfit >= 0 ? 'green' : 'red'}`}>
                        {stats.monthProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div className="stat-info">
                        <h3 style={{ color: stats.monthProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {stats.monthProfit < 0 ? '-' : ''}{currency}{Math.abs(stats.monthProfit).toLocaleString()}
                        </h3>
                        <p>Profit/Loss This Month</p>
                    </div>
                </div>
            </div>

            <div className="stat-cards" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="stat-card" style={{ alignItems: 'flex-start' }}>
                    <div className="stat-icon blue"><Package size={24} /></div>
                    <div className="stat-info" style={{ width: '100%', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3>{stats.stockCrates.toLocaleString()}</h3>
                                <p>Crates in Stock</p>
                            </div>
                        </div>
                        {activePen === 'all' && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: 'var(--font-xs)', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--info)', fontWeight: 600 }}>Emeline's: {stats.emelineStock}</span>
                                <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Dorcas': {stats.dorcasStock}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><ShoppingCart size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.pendingPayments.toLocaleString()}</h3>
                        <p>Pending Payments</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Egg Production (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f5ba42" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#f5ba42" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e8eaf0', borderRadius: '10px', color: '#1e1f3b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            />
                            <Area type="monotone" dataKey="eggs" stroke="#f5ba42" strokeWidth={2} fill="url(#eggGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Revenue vs Expenses (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e8eaf0', borderRadius: '10px', color: '#1e1f3b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(value, name) => [`${currency}${Number(value).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                            />
                            <Bar dataKey="revenue" fill="#34d399" radius={[6, 6, 0, 0]} name="revenue" />
                            <Bar dataKey="expenses" fill="#f87171" radius={[6, 6, 0, 0]} name="expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-lg)' }}>Recent Activity</h3>
                {recentActivity.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Egg size={28} /></div>
                        <h3>No activity yet</h3>
                        <p>Start by recording your first egg collection, sale, or expense</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {recentActivity.map(item => (
                            <div className="activity-item" key={item.id}>
                                <div className={`activity-icon ${item.type === 'collection' ? 'collection' : item.type === 'sale' ? 'sale' : ''}`}
                                    style={item.type === 'expense' ? { background: 'var(--danger-bg)', color: 'var(--danger)' } : {}}>
                                    {item.type === 'collection' ? <Egg size={18} /> : item.type === 'sale' ? <ShoppingCart size={18} /> : <Wallet size={18} />}
                                </div>
                                <div className="activity-details">
                                    <div className="activity-title">{item.title}</div>
                                    <div className="activity-sub">{formatShortDate(item.date)}</div>
                                </div>
                                {item.amount && (
                                    <div className={`activity-amount ${item.amountClass}`}>{item.amount}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
