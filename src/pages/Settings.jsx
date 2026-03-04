import { useState } from 'react'
import { useFarm } from '../context/FarmContext'
import { Settings, Download, Trash2, Upload } from 'lucide-react'

export default function SettingsPage() {
    const { state, dispatch } = useFarm()
    const [form, setForm] = useState({ ...state.settings })
    const [saved, setSaved] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    const handleSave = (e) => {
        e.preventDefault()
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
                farmName: form.farmName.trim() || 'My Poultry Farm',
                eggsPerCrate: Number(form.eggsPerCrate) || 30,
                defaultPricePerCrate: Number(form.defaultPricePerCrate) || 1500,
                currency: form.currency || '₦'
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
    }

    return (
        <div>
            <div className="page-header">
                <h2>Settings</h2>
                <p>Configure your farm details and app preferences</p>
            </div>

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
                                    placeholder="₦"
                                    maxLength={3}
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

            <div className="card mb-lg">
                <div className="settings-section">
                    <h3>💾 Data Management</h3>
                    <p className="text-muted mb-lg" style={{ fontSize: 'var(--font-sm)' }}>
                        Export your data as a JSON backup or import a previous backup file.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={handleExport}>
                            <Download size={16} /> Export Data
                        </button>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            <Upload size={16} /> Import Data
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="card mb-lg">
                <div className="settings-section" style={{ marginBottom: 0 }}>
                    <h3>⚠️ Danger Zone</h3>
                    <p className="text-muted mb-lg" style={{ fontSize: 'var(--font-sm)' }}>
                        This will permanently delete all your data including collections and sales records.
                        Make sure to export your data first!
                    </p>
                    {showClearConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                                Are you sure? This cannot be undone!
                            </span>
                            <button className="btn btn-danger" onClick={handleClearAll}>
                                <Trash2 size={16} /> Yes, Delete All
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
                            <Trash2 size={16} /> Clear All Data
                        </button>
                    )}
                </div>
            </div>

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
