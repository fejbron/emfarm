import { useState, useMemo } from 'react'
import { useFarm, EXPENSE_CATEGORIES } from '../context/FarmContext'
import { BarChart3, Egg, DollarSign, Package, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
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

function formatShortDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Reports() {
    const { state } = useFarm()
    const { collections, sales, expenses, settings } = state
    const currency = settings.currency

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [startDate, setStartDate] = useState(getDateStr(thirtyDaysAgo))
    const [endDate, setEndDate] = useState(getDateStr())

    const filteredData = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00')
        const end = new Date(endDate + 'T23:59:59')

        const filtCollections = collections.filter(c => {
            const d = new Date(c.date + 'T00:00:00')
            return d >= start && d <= end
        })
        const filtSales = sales.filter(s => {
            const d = new Date(s.date + 'T00:00:00')
            return d >= start && d <= end
        })
        const filtExpenses = expenses.filter(e => {
            const d = new Date(e.date + 'T00:00:00')
            return d >= start && d <= end
        })

        const totalEggs = filtCollections.reduce((s, c) => s + Number(c.eggs), 0)
        const totalDamaged = filtCollections.reduce((s, c) => s + Number(c.damagedEggs || 0), 0)
        const totalCrates = filtCollections.reduce((s, c) => s + Number(c.crates), 0)
        const totalRevenue = filtSales.reduce((s, sl) => s + Number(sl.totalAmount), 0)
        const totalCratesSold = filtSales.reduce((s, sl) => s + Number(sl.cratesSold), 0)
        const avgPricePerCrate = totalCratesSold > 0 ? Math.round(totalRevenue / totalCratesSold) : 0

        const totalExpenses = filtExpenses.reduce((s, e) => s + Number(e.amount), 0)
        const profitLoss = totalRevenue - totalExpenses

        // Expense by category
        const expenseByCategory = {}
        EXPENSE_CATEGORIES.forEach(cat => { expenseByCategory[cat] = 0 })
        filtExpenses.forEach(e => {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount)
        })

        // House breakdown
        const house1Eggs = filtCollections.filter(c => c.house === '1').reduce((s, c) => s + Number(c.eggs), 0)
        const house2Eggs = filtCollections.filter(c => c.house === '2').reduce((s, c) => s + Number(c.eggs), 0)

        // Daily chart data
        const dayMap = {}
        const current = new Date(start)
        while (current <= end) {
            const key = getDateStr(current)
            dayMap[key] = { name: formatShortDate(key), eggs: 0, revenue: 0, expenses: 0 }
            current.setDate(current.getDate() + 1)
        }
        filtCollections.forEach(c => { if (dayMap[c.date]) dayMap[c.date].eggs += Number(c.eggs) })
        filtSales.forEach(s => { if (dayMap[s.date]) dayMap[s.date].revenue += Number(s.totalAmount) })
        filtExpenses.forEach(e => { if (dayMap[e.date]) dayMap[e.date].expenses += Number(e.amount) })
        const chartData = Object.values(dayMap)

        // Daily expenses for summary
        const daysInRange = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
        const avgDailyExpense = Math.round(totalExpenses / daysInRange)

        return {
            totalEggs, totalDamaged, totalCrates, totalRevenue, totalCratesSold, avgPricePerCrate,
            totalExpenses, profitLoss, expenseByCategory, house1Eggs, house2Eggs,
            chartData, avgDailyExpense,
            collectionCount: filtCollections.length, salesCount: filtSales.length, expenseCount: filtExpenses.length
        }
    }, [collections, sales, expenses, startDate, endDate])

    const sortedExpenseCategories = useMemo(() => {
        return Object.entries(filteredData.expenseByCategory)
            .filter(([, amount]) => amount > 0)
            .sort((a, b) => b[1] - a[1])
    }, [filteredData.expenseByCategory])

    return (
        <div>
            <div className="page-header">
                <h2>Reports & Analytics</h2>
                <p>Analyze your farm's performance over time</p>
            </div>

            <div className="card mb-lg">
                <div className="date-range-picker">
                    <label>From:</label>
                    <input type="date" className="form-input" style={{ width: 'auto' }}
                        value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <label>To:</label>
                    <input type="date" className="form-input" style={{ width: 'auto' }}
                        value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {/* Key Metrics */}
            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon amber"><Egg size={24} /></div>
                    <div className="stat-info">
                        <h3>{filteredData.totalEggs.toLocaleString()}</h3>
                        <p>Total Eggs</p>
                        <div className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>
                            H1: {filteredData.house1Eggs.toLocaleString()} | H2: {filteredData.house2Eggs.toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{filteredData.totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><Wallet size={24} /></div>
                    <div className="stat-info">
                        <h3>{currency}{filteredData.totalExpenses.toLocaleString()}</h3>
                        <p>Total Expenses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className={`stat-icon ${filteredData.profitLoss >= 0 ? 'green' : 'red'}`}>
                        {filteredData.profitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div className="stat-info">
                        <h3 style={{ color: filteredData.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {filteredData.profitLoss < 0 ? '-' : ''}{currency}{Math.abs(filteredData.profitLoss).toLocaleString()}
                        </h3>
                        <p>Profit / Loss</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Egg Production</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={filteredData.chartData}>
                            <defs>
                                <linearGradient id="eggGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f5ba42" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#f5ba42" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e8eaf0', borderRadius: '10px', color: '#1e1f3b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                            <Area type="monotone" dataKey="eggs" stroke="#f5ba42" strokeWidth={2} fill="url(#eggGrad2)" name="Eggs" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Revenue vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={filteredData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
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

            {/* Expense Category Breakdown */}
            {sortedExpenseCategories.length > 0 && (
                <div className="card mb-lg">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Expense Breakdown</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-right">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedExpenseCategories.map(([cat, amount]) => (
                                    <tr key={cat}>
                                        <td style={{ fontWeight: 600 }}>{cat}</td>
                                        <td className="text-right font-bold text-danger">{currency}{amount.toLocaleString()}</td>
                                        <td className="text-right text-muted">
                                            {filteredData.totalExpenses > 0 ? ((amount / filteredData.totalExpenses) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Period Summary */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-lg)' }}>Period Summary</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Metric</th><th className="text-right">Value</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Total Eggs Collected</td><td className="text-right font-bold">{filteredData.totalEggs.toLocaleString()}</td></tr>
                            <tr><td>Damaged Eggs</td><td className="text-right text-danger">{filteredData.totalDamaged.toLocaleString()}</td></tr>
                            <tr><td>House 1 Eggs</td><td className="text-right">{filteredData.house1Eggs.toLocaleString()}</td></tr>
                            <tr><td>House 2 Eggs</td><td className="text-right">{filteredData.house2Eggs.toLocaleString()}</td></tr>
                            <tr><td>Total Crates Collected</td><td className="text-right font-bold">{filteredData.totalCrates.toLocaleString()}</td></tr>
                            <tr><td>Total Crates Sold</td><td className="text-right font-bold">{filteredData.totalCratesSold.toLocaleString()}</td></tr>
                            <tr><td>Total Revenue</td><td className="text-right font-bold text-success">{currency}{filteredData.totalRevenue.toLocaleString()}</td></tr>
                            <tr><td>Total Expenses</td><td className="text-right font-bold text-danger">{currency}{filteredData.totalExpenses.toLocaleString()}</td></tr>
                            <tr><td>Avg Daily Expense</td><td className="text-right">{currency}{filteredData.avgDailyExpense.toLocaleString()}</td></tr>
                            <tr>
                                <td style={{ fontWeight: 700 }}>Net Profit / Loss</td>
                                <td className="text-right font-bold" style={{ color: filteredData.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--font-md)' }}>
                                    {filteredData.profitLoss < 0 ? '-' : ''}{currency}{Math.abs(filteredData.profitLoss).toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
