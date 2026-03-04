import { useState, useEffect } from 'react'
import { useFarm } from '../context/FarmContext'
import { supabase } from '../supabase'
import { Settings, Download, Trash2, Upload, FileSpreadsheet, Users, Shield, ShieldAlert } from 'lucide-react'

export default function SettingsPage() {
    const { state, dispatch } = useFarm()
    const { profile } = state
    const [form, setForm] = useState({ ...state.settings })
    const [saved, setSaved] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // User management state
    const [profiles, setProfiles] = useState([])
    const [loadingProfiles, setLoadingProfiles] = useState(false)

    useEffect(() => {
        if (profile?.role === 'super_admin' && state.isSupabase !== false) {
            fetchProfiles()
        }
    }, [profile, state.isSupabase])

    const fetchProfiles = async () => {
        setLoadingProfiles(true)
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        if (!error && data) {
            setProfiles(data)
        }
        setLoadingProfiles(false)
    }

    const toggleUserRole = async (userId, currentRole) => {
        if (currentRole === 'super_admin' && profiles.filter(p => p.role === 'super_admin').length <= 1) {
            alert("You cannot demote the only super admin.")
            return
        }

        const roles = ['owner', 'manager', 'super_admin']
        const currentIdx = roles.indexOf(currentRole)
        const newRole = roles[(currentIdx + 1) % roles.length]

        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)

        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p))
        } else {
            alert("Failed to update role: " + error.message)
        }
    }

    const handleSave = (e) => {
        e.preventDefault()
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                farmName: form.farmName.trim() || 'My Poultry Farm',
                eggsPerCrate: Number(form.eggsPerCrate) || 30,
                defaultPricePerCrate: Number(form.defaultPricePerCrate) || 1500,
                currency: form.currency || 'GHS '
            }
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleExport = () => {
        const data = JSON.stringify(state, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `eggledger-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const downloadCsv = (filename, headers, rows) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                const str = String(cell ?? '')
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str
            }).join(','))
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    const exportCollectionsCsv = () => {
        downloadCsv(
            `egg-collections-${new Date().toISOString().split('T')[0]}.csv`,
            ['Date', 'House', 'Total Eggs', 'Damaged Eggs', 'Good Eggs', 'Crates', 'Notes'],
            state.collections.map(c => [
                c.date, `House ${c.house || '1'}`, c.eggs, c.damagedEggs || 0,
                c.goodEggs || (Number(c.eggs) - Number(c.damagedEggs || 0)),
                c.crates, c.notes || ''
            ])
        )
    }

    const exportSalesCsv = () => {
        downloadCsv(
            `sales-${new Date().toISOString().split('T')[0]}.csv`,
            ['Date', 'Customer', 'Crates Sold', 'Price per Crate', 'Total Amount', 'Payment Status'],
            state.sales.map(s => [
                s.date, s.customerName, s.cratesSold, s.pricePerCrate, s.totalAmount, s.paymentStatus
            ])
        )
    }

    const exportExpensesCsv = () => {
        downloadCsv(
            `expenses-${new Date().toISOString().split('T')[0]}.csv`,
            ['Date', 'Category', 'Description', 'Amount', 'Payment Method'],
            state.expenses.map(e => [
                e.date, e.category, e.description || '', e.amount, e.paymentMethod || ''
            ])
        )
    }

    const handleImport = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result)
                if (data.collections && data.sales) {
                    dispatch({ type: 'IMPORT_DATA', payload: data })
                    setForm({ ...data.settings })
                    alert('Data imported successfully!')
                } else {
                    alert('Invalid backup file format')
                }
            } catch {
                alert('Failed to parse file. Make sure it is a valid JSON backup.')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const handleClearAll = () => {
        dispatch({ type: 'CLEAR_ALL' })
        setForm({
            farmName: 'My Poultry Farm',
            eggsPerCrate: 30,
            defaultPricePerCrate: 1500,
            currency: 'GHS '
        })
        setShowClearConfirm(false)
        setDeleteConfirmText('')
    }

    return (
        <div>
            <div className="page-header">
                <h2>Settings</h2>
                <p>Configure your farm details and app preferences</p>
            </div>

            {profile?.role === 'super_admin' && state.isSupabase !== false && (
                <div className="card mb-lg">
                    <div className="settings-section">
                        <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> User Management</h3>
                        <p className="text-muted mb-lg" style={{ fontSize: 'var(--font-sm)' }}>
                            Control who has access to your farm data. Super Admins manage apps, Managers edit data, Owners only view.
                        </p>

                        {loadingProfiles ? (
                            <p style={{ fontSize: 'var(--font-sm)' }}>Loading users...</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profiles.map(p => (
                                            <tr key={p.id}>
                                                <td className="font-bold">{p.full_name || 'Unknown'}</td>
                                                <td>{p.email}</td>
                                                <td>
                                                    <span className={`badge ${p.role === 'super_admin' ? 'badge-primary' : (p.role === 'manager' ? 'badge-success' : 'badge-info')}`}>
                                                        {p.role === 'super_admin' ? <Shield size={12} style={{ marginRight: '4px' }} /> : (p.role === 'manager' ? <Users size={12} style={{ marginRight: '4px' }} /> : <ShieldAlert size={12} style={{ marginRight: '4px' }} />)}
                                                        {p.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem', width: '130px' }}
                                                        onClick={() => toggleUserRole(p.id, p.role)}
                                                        disabled={p.id === state.user?.id}
                                                    >
                                                        Change Role
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {profile?.role === 'super_admin' && (
                <div className="card mb-lg">
                    <div className="settings-section">
                        <h3>🏠 Farm Details</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Farm Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.farmName}
                                        onChange={e => setForm(f => ({ ...f, farmName: e.target.value }))}
                                        placeholder="My Poultry Farm"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Currency Symbol</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.currency}
                                        onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                                        placeholder="GHS "
                                        maxLength={5}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Eggs per Crate</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.eggsPerCrate}
                                        onChange={e => setForm(f => ({ ...f, eggsPerCrate: e.target.value }))}
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Default Price per Crate ({form.currency})</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={form.defaultPricePerCrate}
                                        onChange={e => setForm(f => ({ ...f, defaultPricePerCrate: e.target.value }))}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                <button type="submit" className="btn btn-primary">
                                    <Settings size={16} /> Save Settings
                                </button>
                                {saved && (
                                    <span className="badge badge-success" style={{ animation: 'fadeIn 0.3s ease' }}>
                                        ✓ Settings saved!
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {profile?.role === 'super_admin' && (
                <div className="card mb-lg">
                    <div className="settings-section">
                        <h3>💾 Data Management</h3>
                        <p className="text-muted mb-lg" style={{ fontSize: 'var(--font-sm)' }}>
                            Export your data as JSON backup or download individual CSV reports.
                        </p>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
                                Full Backup (JSON)
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" onClick={handleExport}>
                                    <Download size={16} /> Export JSON
                                </button>
                                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                    <Upload size={16} /> Import JSON
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div>
                            <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
                                CSV Reports
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" onClick={exportCollectionsCsv} disabled={state.collections.length === 0}>
                                    <FileSpreadsheet size={16} /> Collections ({state.collections.length})
                                </button>
                                <button className="btn btn-secondary" onClick={exportSalesCsv} disabled={state.sales.length === 0}>
                                    <FileSpreadsheet size={16} /> Sales ({state.sales.length})
                                </button>
                                <button className="btn btn-secondary" onClick={exportExpensesCsv} disabled={state.expenses.length === 0}>
                                    <FileSpreadsheet size={16} /> Expenses ({state.expenses.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {profile?.role === 'manager' && (
                <div className="card mb-lg">
                    <div className="settings-section" style={{ marginBottom: 0 }}>
                        <h3>⚠️ Danger Zone</h3>
                        <p className="text-muted mb-lg" style={{ fontSize: 'var(--font-sm)' }}>
                            This will permanently delete all your data including collections and sales records.
                            Make sure to export your data first!
                        </p>
                        {showClearConfirm ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                                    Are you sure? This cannot be undone! Type <strong>DELETE</strong> below to confirm.
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Type DELETE"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        style={{ maxWidth: '150px' }}
                                    />
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleClearAll}
                                        disabled={deleteConfirmText !== 'DELETE'}
                                    >
                                        <Trash2 size={16} /> Yes, Delete All
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => {
                                        setShowClearConfirm(false)
                                        setDeleteConfirmText('')
                                    }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
                                <Trash2 size={16} /> Clear All Data
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="settings-section" style={{ marginBottom: 0 }}>
                    <h3>📊 Current Data Summary</h3>
                    <div className="table-container">
                        <table>
                            <tbody>
                                <tr>
                                    <td>Total Collection Records</td>
                                    <td className="text-right font-bold">{state.collections.length}</td>
                                </tr>
                                <tr>
                                    <td>Total Sales Records</td>
                                    <td className="text-right font-bold">{state.sales.length}</td>
                                </tr>
                                <tr>
                                    <td>Total Eggs Collected</td>
                                    <td className="text-right font-bold">
                                        {state.collections.reduce((s, c) => s + Number(c.eggs), 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Total Revenue</td>
                                    <td className="text-right font-bold text-success">
                                        {form.currency}{state.sales.reduce((s, sl) => s + Number(sl.totalAmount), 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
