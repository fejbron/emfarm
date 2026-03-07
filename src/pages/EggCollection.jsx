import { useState, useMemo } from 'react'
import { useFarm } from '../context/FarmContext'
import { Egg, Plus, Trash2, X, Package, Home, AlertTriangle, Edit2 } from 'lucide-react'

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

export default function EggCollection() {
    const { state, dispatch } = useFarm()
    const { collections, settings, profile, activePen } = state
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        date: getDateStr(),
        eggs: '',
        damagedEggs: '0',
        house: "Emeline's Pen",
        crates: '',
        notes: ''
    })

    const openModal = () => setShowModal(true)
    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setForm({ date: getDateStr(), eggs: '', damagedEggs: '0', house: "Emeline's Pen", crates: '', notes: '' })
    }

    const handleEdit = (c) => {
        setForm({
            date: c.date,
            eggs: String(c.eggs),
            damagedEggs: String(c.damagedEggs || '0'),
            house: c.house || "Emeline's Pen",
            crates: String(c.crates),
            notes: c.notes || ''
        })
        setEditingId(c.id)
        setShowModal(true)
    }

    const today = getDateStr()

    const filterByActivePen = (item) => {
        if (activePen === 'all') return true
        if (item.house === activePen) return true
        if (activePen === "Emeline's Pen" && String(item.house) === '1') return true
        if (activePen === "Dorcas' Pen" && String(item.house) === '2') return true
        return false
    }

    const filteredCollections = useMemo(() => collections.filter(filterByActivePen), [collections, activePen])

    const stats = useMemo(() => {
        const activeCollections = collections.filter(filterByActivePen)
        const todayItems = activeCollections.filter(c => c.date === today)
        const todayEggs = todayItems.reduce((s, c) => s + Number(c.eggs), 0)
        const todayCrates = Number(todayItems.reduce((s, c) => s + Number(c.crates), 0).toFixed(2))
        const todayDamaged = todayItems.reduce((s, c) => s + Number(c.damagedEggs || 0), 0)

        const house1Today = todayItems.filter(c => c.house === "Emeline's Pen" || String(c.house) === '1').reduce((s, c) => s + Number(c.eggs), 0)
        const house2Today = todayItems.filter(c => c.house === "Dorcas' Pen" || String(c.house) === '2').reduce((s, c) => s + Number(c.eggs), 0)

        const last7 = new Date()
        last7.setDate(last7.getDate() - 7)
        const weekItems = activeCollections.filter(c => new Date(c.date + 'T00:00:00') >= last7)
        const weekAvg = weekItems.length > 0
            ? Math.round(weekItems.reduce((s, c) => s + Number(c.eggs), 0) / 7)
            : 0

        const totalDamaged = activeCollections.reduce((s, c) => s + Number(c.damagedEggs || 0), 0)

        return { todayEggs, todayCrates, todayDamaged, house1Today, house2Today, weekAvg, totalDamaged }
    }, [collections, today, activePen])

    const handleEggsChange = (val) => {
        const eggs = val
        const goodEggs = Math.max(0, Number(eggs) - Number(form.damagedEggs || 0))
        const crates = eggs ? parseFloat((goodEggs / settings.eggsPerCrate).toFixed(2)) : ''
        setForm(f => ({ ...f, eggs, crates: String(crates) }))
    }

    const handleDamagedChange = (val) => {
        const damagedEggs = val
        const goodEggs = Math.max(0, Number(form.eggs) - Number(damagedEggs || 0))
        const crates = form.eggs ? parseFloat((goodEggs / settings.eggsPerCrate).toFixed(2)) : ''
        setForm(f => ({ ...f, damagedEggs, crates: String(crates) }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.eggs || Number(form.eggs) <= 0) return
        const goodEggs = Math.max(0, Number(form.eggs) - Number(form.damagedEggs || 0))
        
        const payload = {
            date: form.date,
            eggs: Number(form.eggs),
            damagedEggs: Number(form.damagedEggs) || 0,
            goodEggs,
            house: form.house,
            crates: Number(form.crates) || parseFloat((goodEggs / settings.eggsPerCrate).toFixed(2)),
            notes: form.notes.trim()
        }

        if (editingId) {
            payload.updatedByName = profile?.full_name || 'User'
            payload.updatedAt = new Date().toISOString()
            dispatch({ type: 'UPDATE_COLLECTION', payload: { id: editingId, data: payload } })
        } else {
            payload.createdByName = profile?.full_name || 'User'
            dispatch({ type: 'ADD_COLLECTION', payload })
        }
        
        closeModal()
    }

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_COLLECTION', payload: id })
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>Egg Collection</h2>
                    <p>Track daily egg production by house</p>
                </div>
                {['manager', 'super_admin'].includes(profile?.role) && (
                    <button className="btn btn-primary" onClick={openModal}>
                        <Plus size={18} /> Add Collection
                    </button>
                )}
            </div>

            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon amber"><Egg size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.todayEggs.toLocaleString()}</h3>
                        <p>Eggs Today</p>
                        <div className="stat-trend up">{stats.todayCrates} crate{stats.todayCrates !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Home size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.house1Today} / {stats.house2Today}</h3>
                        <p>Emeline's / Dorcas' Pen</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.todayDamaged}</h3>
                        <p>Damaged Today</p>
                        <div className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>{stats.totalDamaged} total</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><Egg size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.weekAvg.toLocaleString()}</h3>
                        <p>Daily Avg (7d)</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Collection History</h3>
                </div>

                {filteredCollections.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Egg size={28} /></div>
                        <h3>No collections recorded</h3>
                        <p>{['manager', 'super_admin'].includes(profile?.role) ? 'Click "Add Collection" to log your first egg collection' : 'Waiting for the manager to log collections'}</p>
                        {['manager', 'super_admin'].includes(profile?.role) && (
                            <button className="btn btn-primary" onClick={openModal}>
                                <Plus size={18} /> Add Collection
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>House</th>
                                    <th>Eggs</th>
                                    <th>Damaged</th>
                                    <th>Good Eggs</th>
                                    <th>Crates</th>
                                    <th>Notes</th>
                                    {['manager', 'super_admin'].includes(profile?.role) && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCollections.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(c.date)}</div>
                                            {(c.createdByName || c.updatedByName) && (
                                                <div className="text-muted" style={{ fontSize: '10px', marginTop: '4px', whiteSpace: 'nowrap' }}>
                                                    {c.updatedByName ? `Edited by ${c.updatedByName}` : `Added by ${c.createdByName}`}
                                                </div>
                                            )}
                                        </td>
                                        <td><span className="badge badge-info">{c.house || "Emeline's Pen"}</span></td>
                                        <td className="font-bold text-accent">{Number(c.eggs).toLocaleString()}</td>
                                        <td>{Number(c.damagedEggs || 0) > 0 ? <span className="text-danger">{c.damagedEggs}</span> : '0'}</td>
                                        <td className="font-bold">{(Number(c.goodEggs) || (Number(c.eggs) - Number(c.damagedEggs || 0))).toLocaleString()}</td>
                                        <td>{c.crates}</td>
                                        <td className="text-muted">{c.notes || '—'}</td>
                                        {['manager', 'super_admin'].includes(profile?.role) && (
                                            <td>
                                                <div className="flex justify-end" style={{ gap: '12px' }}>
                                                    <button className="btn btn-icon btn-secondary" title="Edit" onClick={() => handleEdit(c)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Egg Collection' : 'Add Egg Collection'}</h3>
                            <button className="btn btn-icon btn-secondary" onClick={closeModal}>
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
                                    <label>Total Eggs Collected</label>
                                    <input type="number" className="form-input" placeholder="e.g., 150"
                                        value={form.eggs} onChange={e => handleEggsChange(e.target.value)} min="1" required />
                                </div>
                                <div className="form-group">
                                    <label>Damaged / Broken Eggs</label>
                                    <input type="number" className="form-input" placeholder="0"
                                        value={form.damagedEggs} onChange={e => handleDamagedChange(e.target.value)} min="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Crates ({settings.eggsPerCrate} good eggs/crate)</label>
                                <input type="number" className="form-input" value={form.crates}
                                    onChange={e => setForm(f => ({ ...f, crates: e.target.value }))} min="0" step="0.01" />
                                <span className="text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '4px', display: 'block' }}>
                                    Auto-calculated from good eggs (total − damaged)
                                </span>
                            </div>
                            <div className="form-group">
                                <label>Notes (optional)</label>
                                <textarea className="form-textarea" placeholder="Any additional notes..."
                                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Collection'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
