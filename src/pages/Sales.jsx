import { useState, useMemo } from 'react'
import { useFarm } from '../context/FarmContext'
import { ShoppingCart, Plus, Trash2, X, DollarSign, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react'

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

export default function Sales() {
    const { state, dispatch } = useFarm()
    const { sales, collections, settings, profile, activePen } = state
    const currency = settings.currency
    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState('all')
    const [form, setForm] = useState({
        date: getDateStr(),
        customerName: '',
        cratesSold: '',
        pricePerCrate: String(settings.defaultPricePerCrate),
        paymentStatus: 'paid',
        house: "Emeline's Pen"
    })

    const stockCrates = useMemo(() => {
        const totalCollected = collections.reduce((s, c) => s + Number(c.crates), 0)
        const totalSold = sales.reduce((s, sl) => s + Number(sl.cratesSold), 0)
        return totalCollected - totalSold
    }, [collections, sales])

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((s, sl) => s + Number(sl.totalAmount), 0)
        const paidAmount = sales
            .filter(s => s.paymentStatus === 'paid')
            .reduce((s, sl) => s + Number(sl.totalAmount), 0)
        const pendingAmount = sales
            .filter(s => s.paymentStatus !== 'paid')
            .reduce((s, sl) => s + Number(sl.totalAmount), 0)
        const totalCratesSold = sales.reduce((s, sl) => s + Number(sl.cratesSold), 0)
        return { totalRevenue, paidAmount, pendingAmount, totalCratesSold }
    }, [sales])

    const filterByActivePen = (item) => {
        if (activePen === 'all') return true
        if (item.house === activePen) return true
        if (activePen === "Emeline's Pen" && String(item.house) === '1') return true
        if (activePen === "Dorcas' Pen" && String(item.house) === '2') return true
        return false
    }

    const filteredSales = useMemo(() => {
        let result = sales.filter(filterByActivePen)
        if (filter !== 'all') {
            result = result.filter(s => s.paymentStatus === filter)
        }
        return result
    }, [sales, filter, activePen])

    const handleCratesChange = (val) => {
        const cratesSold = val
        const total = cratesSold && form.pricePerCrate
            ? Number(cratesSold) * Number(form.pricePerCrate)
            : ''
        setForm(f => ({ ...f, cratesSold, totalAmount: String(total) }))
    }

    const handlePriceChange = (val) => {
        const pricePerCrate = val
        const total = form.cratesSold && pricePerCrate
            ? Number(form.cratesSold) * Number(pricePerCrate)
            : ''
        setForm(f => ({ ...f, pricePerCrate, totalAmount: String(total) }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.cratesSold || !form.customerName.trim()) return
        const cratesSold = Number(form.cratesSold)
        if (cratesSold > stockCrates) {
            alert(`Not enough stock! You only have ${stockCrates} crate(s) available.`)
            return
        }
        dispatch({
            type: 'ADD_SALE',
            payload: {
                date: form.date,
                customerName: form.customerName.trim(),
                cratesSold,
                pricePerCrate: Number(form.pricePerCrate),
                totalAmount: Number(form.totalAmount) || cratesSold * Number(form.pricePerCrate),
                paymentStatus: form.paymentStatus,
                house: form.house
            }
        })
        setForm({
            date: getDateStr(),
            customerName: '',
            cratesSold: '',
            pricePerCrate: String(settings.defaultPricePerCrate),
            totalAmount: '',
            paymentStatus: 'paid',
            house: "Emeline's Pen"
        })
        setShowModal(false)
    }

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_SALE', payload: id })
    }

    const cyclePaymentStatus = (sale) => {
        const statusOrder = ['paid', 'partial', 'unpaid']
        const currentIdx = statusOrder.indexOf(sale.paymentStatus)
        const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length]
        dispatch({
            type: 'UPDATE_SALE',
            payload: { id: sale.id, data: { paymentStatus: nextStatus } }
        })
    }

    const statusBadgeClass = (status) => {
        if (status === 'paid') return 'badge-success'
        if (status === 'partial') return 'badge-warning'
        return 'badge-danger'
    }

    const statusLabel = (status) => {
        if (status === 'paid') return '✓ Paid'
        if (status === 'partial') return '◐ Partial'
        return '✗ Unpaid'
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>Sales</h2>
                    <p>Track your egg crate sales and payments</p>
                </div>
                <div className="flex gap-md items-center" style={{ flexWrap: 'wrap' }}>
                    <div className="badge badge-info" style={{ padding: '6px 14px', fontSize: 'var(--font-sm)' }}>
                        <Package size={14} style={{ marginRight: '6px' }} /> {stockCrates} crate{stockCrates !== 1 ? 's' : ''} in stock
                    </div>
                    {['manager', 'super_admin'].includes(profile?.role) && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Record Sale
                        </button>
                    )}
                </div>
            </div>

            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><ShoppingCart size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.totalCratesSold.toLocaleString()}</h3>
                        <p>Total Crates Sold</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.paidAmount.toLocaleString()}</h3>
                        <p>Paid</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{stats.pendingAmount.toLocaleString()}</h3>
                        <p>Outstanding</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Sales History</h3>
                    <div className="filters-bar" style={{ marginBottom: 0 }}>
                        {['all', 'paid', 'partial', 'unpaid'].map(f => (
                            <button
                                key={`status-${f}`}
                                className={`filter-chip ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredSales.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><ShoppingCart size={28} /></div>
                        <h3>No sales recorded</h3>
                        <p>{filter !== 'all' ? 'No sales match this filter' : (['manager', 'super_admin'].includes(profile?.role) ? 'Click "Record Sale" to log your first sale' : 'Waiting for the manager to record sales')}</p>
                        {filter === 'all' && ['manager', 'super_admin'].includes(profile?.role) && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> Record Sale
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Pen</th>
                                    <th>Crates</th>
                                    <th>Price/Crate</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    {['manager', 'super_admin'].includes(profile?.role) && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(s.date)}</td>
                                        <td style={{ fontWeight: 600 }}>{s.customerName}</td>
                                        <td><span className="badge badge-info">{s.house || "Emeline's Pen"}</span></td>
                                        <td>{s.cratesSold}</td>
                                        <td>{currency}{Number(s.pricePerCrate).toLocaleString()}</td>
                                        <td className="font-bold text-success">{currency}{Number(s.totalAmount).toLocaleString()}</td>
                                        <td>
                                            <button
                                                className={`badge ${statusBadgeClass(s.paymentStatus)}`}
                                                onClick={() => ['manager', 'super_admin'].includes(profile?.role) && cyclePaymentStatus(s)}
                                                style={{ cursor: ['manager', 'super_admin'].includes(profile?.role) ? 'pointer' : 'default', border: 'none' }}
                                                title={['manager', 'super_admin'].includes(profile?.role) ? "Click to change status" : ""}
                                                disabled={!['manager', 'super_admin'].includes(profile?.role)}
                                            >
                                                {statusLabel(s.paymentStatus)}
                                            </button>
                                        </td>
                                        {['manager', 'super_admin'].includes(profile?.role) && (
                                            <td>
                                                <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(s.id)}>
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
                            <h3>Record Sale</h3>
                            <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ marginBottom: 'var(--space-md)', padding: '8px 12px', background: 'var(--info-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--info)' }}>
                            <Package size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Available stock: <strong>{stockCrates}</strong> crate{stockCrates !== 1 ? 's' : ''}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" className="form-input" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <input type="text" className="form-input" placeholder="e.g., John Doe"
                                        value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Crates Sold</label>
                                    <input type="number" className="form-input" placeholder="e.g., 5"
                                        value={form.cratesSold} onChange={e => handleCratesChange(e.target.value)}
                                        min="1" max={stockCrates} required />
                                </div>
                                <div className="form-group">
                                    <label>House / Pen</label>
                                    <select className="form-select" value={form.house}
                                        onChange={e => setForm(f => ({ ...f, house: e.target.value }))}>
                                        <option value="Emeline's Pen">Emeline's Pen</option>
                                        <option value="Dorcas' Pen">Dorcas' Pen</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price per Crate ({currency.trim()})</label>
                                    <input type="number" className="form-input" value={form.pricePerCrate}
                                        onChange={e => handlePriceChange(e.target.value)} min="0" required />
                                </div>
                                <div className="form-group">
                                    <label>Total Amount ({currency.trim()})</label>
                                    <input type="number" className="form-input" value={form.totalAmount}
                                        onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} min="0" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Total Amount ({currency.trim()})</label>
                                    <input type="number" className="form-input" value={form.totalAmount}
                                        onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Payment Status</label>
                                    <select className="form-select" value={form.paymentStatus}
                                        onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                                        <option value="paid">Paid</option>
                                        <option value="partial">Partial</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Sale</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
