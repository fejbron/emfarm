import { useState, useMemo } from 'react'
import { useFarm, EXPENSE_CATEGORIES } from '../context/FarmContext'
import { Wallet, Plus, Trash2, X, TrendingDown, Calendar, Tag } from 'lucide-react'

function getDateStr() {
    return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Other']

export default function Expenses() {
    const { state, dispatch } = useFarm()
    const { expenses, settings, profile } = state
    const currency = settings.currency
    const [showModal, setShowModal] = useState(false)
    const [filterCategory, setFilterCategory] = useState('all')
    const [form, setForm] = useState({
        date: getDateStr(),
        category: 'Feed',
        description: '',
        amount: '',
        paymentMethod: 'Cash'
    })

    const today = getDateStr()

    const stats = useMemo(() => {
        // Today's expenses
        const todayExpenses = expenses
            .filter(e => e.date === today)
            .reduce((s, e) => s + Number(e.amount), 0)

        // This month
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthExpenses = expenses
            .filter(e => new Date(e.date + 'T00:00:00') >= monthStart)
            .reduce((s, e) => s + Number(e.amount), 0)

        // Total
        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

        // By category
        const byCategory = {}
        EXPENSE_CATEGORIES.forEach(cat => { byCategory[cat] = 0 })
        expenses.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
        })

        return { todayExpenses, monthExpenses, totalExpenses, byCategory }
    }, [expenses, today])

    const filteredExpenses = useMemo(() => {
        if (filterCategory === 'all') return expenses
        return expenses.filter(e => e.category === filterCategory)
    }, [expenses, filterCategory])

    // Sort categories by amount for the summary
    const sortedCategories = useMemo(() => {
        return Object.entries(stats.byCategory)
            .filter(([, amount]) => amount > 0)
            .sort((a, b) => b[1] - a[1])
    }, [stats.byCategory])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.amount || Number(form.amount) <= 0) return
        dispatch({
            type: 'ADD_EXPENSE',
            payload: {
                date: form.date,
                category: form.category,
                description: form.description.trim(),
                amount: Number(form.amount),
                paymentMethod: form.paymentMethod
            }
        })
        setForm({ date: getDateStr(), category: form.category, description: '', amount: '', paymentMethod: 'Cash' })
        setShowModal(false)
    }

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_EXPENSE', payload: id })
    }

    const categoryColor = (cat) => {
        const colors = {
            Feed: '#f5ba42', Medication: '#f87171', Labor: '#60a5fa',
            Transport: '#a78bfa', Utilities: '#34d399', Maintenance: '#fb923c',
            Equipment: '#38bdf8', Other: '#9a9aad'
        }
        return colors[cat] || '#9a9aad'
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>Expenses</h2>
                    <p>Track farm expenses by category</p>
                </div>
                {['manager', 'super_admin'].includes(profile?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Add Expense
                    </button>
                )}
            </div>

            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon red"><Calendar size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.todayExpenses.toLocaleString()}</h3>
                        <p>Today's Expenses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><TrendingDown size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.monthExpenses.toLocaleString()}</h3>
                        <p>This Month</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Wallet size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.totalExpenses.toLocaleString()}</h3>
                        <p>Total Expenses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><Tag size={24} /></div>
                    <div className="stat-info">
                        <h3>{sortedCategories.length}</h3>
                        <p>Active Categories</p>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            {sortedCategories.length > 0 && (
                <div className="card mb-lg">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Expense Breakdown by Category</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sortedCategories.map(([cat, amount]) => {
                            const pct = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0
                            return (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ width: '100px', fontSize: 'var(--font-sm)', fontWeight: 600, color: categoryColor(cat) }}>{cat}</span>
                                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: categoryColor(cat),
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <span style={{ width: '120px', textAlign: 'right', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
                                        {currency}{amount.toLocaleString()}
                                    </span>
                                    <span style={{ width: '50px', textAlign: 'right', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                                        {pct.toFixed(0)}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Expense History</h3>
                    <div className="filters-bar" style={{ marginBottom: 0 }}>
                        <button
                            className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >All</button>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                                onClick={() => setFilterCategory(cat)}
                            >{cat}</button>
                        ))}
                    </div>
                </div>

                {filteredExpenses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Wallet size={28} /></div>
                        <h3>No expenses recorded</h3>
                        <p>{filterCategory !== 'all' ? `No ${filterCategory} expenses found` : (['manager', 'super_admin'].includes(profile?.role) ? 'Click "Add Expense" to log your first expense' : 'Waiting for the manager to record expenses')}</p>
                        {filterCategory === 'all' && ['manager', 'super_admin'].includes(profile?.role) && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> Add Expense
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Payment</th>
                                    <th>Amount</th>
                                    {['manager', 'super_admin'].includes(profile?.role) && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(e => (
                                    <tr key={e.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(e.date)}</td>
                                        <td>
                                            <span className="badge" style={{
                                                background: `${categoryColor(e.category)}20`,
                                                color: categoryColor(e.category)
                                            }}>{e.category}</span>
                                        </td>
                                        <td>{e.description || '—'}</td>
                                        <td className="text-muted">{e.paymentMethod}</td>
                                        <td className="font-bold text-danger">{currency}{Number(e.amount).toLocaleString()}</td>
                                        {['manager', 'super_admin'].includes(profile?.role) && (
                                            <td>
                                                <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(e.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Expense</h3>
                            <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" className="form-input" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-select" value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" className="form-input" placeholder="e.g., 5 bags of layer feed"
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount ({currency.trim()})</label>
                                    <input type="number" className="form-input" placeholder="e.g., 500"
                                        value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        min="1" required />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select className="form-select" value={form.paymentMethod}
                                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                        {PAYMENT_METHODS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
