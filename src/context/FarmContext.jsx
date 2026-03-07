import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'

const FarmContext = createContext()

const EXPENSE_CATEGORIES = [
    'Feed',
    'Medication',
    'Labor',
    'Transport',
    'Utilities',
    'Maintenance',
    'Equipment',
    'Other'
]

const defaultSettings = {
    farmName: 'My Poultry Farm',
    eggsPerCrate: 30,
    defaultPricePerCrate: 1500,
    currency: 'GHS '
}

const initialState = {
    user: null,
    profile: null,
    collections: [],
    sales: [],
    expenses: [],
    settings: { ...defaultSettings },
    loading: true,
    activePen: 'all'
}

// ── Helpers: convert between camelCase (JS) and snake_case (DB) ──

function toDb(obj, type) {
    let result = {}
    if (type === 'collection') {
        result = {
            date: obj.date,
            eggs: obj.eggs,
            damaged_eggs: obj.damagedEggs || 0,
            good_eggs: obj.goodEggs || obj.eggs,
            house: obj.house || "Emeline's Pen",
            crates: obj.crates,
            notes: obj.notes || ''
        }
    } else if (type === 'sale') {
        result = {
            date: obj.date,
            customer_name: obj.customerName,
            crates_sold: obj.cratesSold,
            price_per_crate: obj.pricePerCrate,
            total_amount: obj.totalAmount,
            payment_status: obj.paymentStatus || 'paid',
            house: obj.house || "Emeline's Pen"
        }
    } else if (type === 'expense') {
        result = {
            date: obj.date,
            category: obj.category,
            description: obj.description || '',
            amount: obj.amount,
            payment_method: obj.paymentMethod || 'Cash',
            house: obj.house || "Emeline's Pen"
        }
    } else {
        result = { ...obj }
    }

    if (obj.createdByName) result.created_by_name = obj.createdByName
    if (obj.updatedByName) result.updated_by_name = obj.updatedByName
    if (obj.updatedAt) result.updated_at = obj.updatedAt

    return result
}

function fromDbCollection(row) {
    return {
        id: row.id,
        date: row.date,
        eggs: row.eggs,
        damagedEggs: row.damaged_eggs,
        goodEggs: row.good_eggs,
        house: row.house,
        crates: row.crates,
        notes: row.notes,
        createdByName: row.created_by_name,
        updatedByName: row.updated_by_name,
        updatedAt: row.updated_at
    }
}

function fromDbSale(row) {
    return {
        id: row.id,
        date: row.date,
        customerName: row.customer_name,
        cratesSold: row.crates_sold,
        pricePerCrate: row.price_per_crate,
        totalAmount: row.total_amount,
        paymentStatus: row.payment_status,
        house: row.house,
        createdByName: row.created_by_name,
        updatedByName: row.updated_by_name,
        updatedAt: row.updated_at
    }
}

function fromDbExpense(row) {
    return {
        id: row.id,
        date: row.date,
        category: row.category,
        description: row.description,
        amount: row.amount,
        paymentMethod: row.payment_method,
        house: row.house,
        createdByName: row.created_by_name,
        updatedByName: row.updated_by_name,
        updatedAt: row.updated_at
    }
}

function fromDbSettings(row) {
    return {
        farmName: row.farm_name,
        eggsPerCrate: row.eggs_per_crate,
        defaultPricePerCrate: Number(row.default_price_per_crate),
        currency: row.currency
    }
}

// ── Local storage fallback ──

const STORAGE_KEY = 'eggledger_data'

function loadLocalState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            return {
                collections: parsed.collections || [],
                sales: parsed.sales || [],
                expenses: parsed.expenses || [],
                settings: { ...defaultSettings, ...parsed.settings },
                loading: false,
                activePen: parsed.activePen || 'all'
            }
        }
    } catch (e) {
        console.error('Failed to load local state:', e)
    }
    return { ...initialState, loading: false }
}

// ── Reducer ──

function farmReducer(state, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload.user, profile: action.payload.profile }
        case 'SIGN_OUT':
            return { ...initialState, loading: false }
        case 'SET_COLLECTIONS':
            return { ...state, collections: action.payload }
        case 'SET_SALES':
            return { ...state, sales: action.payload }
        case 'SET_EXPENSES':
            return { ...state, expenses: action.payload }
        case 'SET_SETTINGS':
            return { ...state, settings: { ...defaultSettings, ...action.payload } }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_ACTIVE_PEN':
            return { ...state, activePen: action.payload }
        // Local-only actions
        case 'ADD_COLLECTION':
            return { ...state, collections: [{ id: Date.now().toString(), ...action.payload }, ...state.collections] }
        case 'DELETE_COLLECTION':
            return { ...state, collections: state.collections.filter(c => c.id !== action.payload) }
        case 'UPDATE_COLLECTION':
            return { ...state, collections: state.collections.map(c => c.id === action.payload.id ? { ...c, ...action.payload.data } : c) }
        case 'ADD_SALE':
            return { ...state, sales: [{ id: Date.now().toString(), ...action.payload }, ...state.sales] }
        case 'DELETE_SALE':
            return { ...state, sales: state.sales.filter(s => s.id !== action.payload) }
        case 'UPDATE_SALE':
            return { ...state, sales: state.sales.map(s => s.id === action.payload.id ? { ...s, ...action.payload.data } : s) }
        case 'ADD_EXPENSE':
            return { ...state, expenses: [{ id: Date.now().toString(), ...action.payload }, ...state.expenses] }
        case 'DELETE_EXPENSE':
            return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) }
        case 'UPDATE_EXPENSE':
            return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload.data } : e) }
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } }
        case 'CLEAR_ALL':
            return { ...initialState, loading: false }
        case 'IMPORT_DATA':
            return {
                collections: action.payload.collections || [],
                sales: action.payload.sales || [],
                expenses: action.payload.expenses || [],
                settings: { ...defaultSettings, ...action.payload.settings },
                loading: false
            }
        default:
            return state
    }
}

// ── Provider ──

export function FarmProvider({ children }) {
    const useSupabase = !!supabase
    const [state, dispatch] = useReducer(farmReducer, null, () =>
        useSupabase ? initialState : loadLocalState()
    )
    const isLocal = useRef(!useSupabase)

    // ── Supabase: initial fetch + real-time subscriptions ──
    useEffect(() => {
        if (!useSupabase) return

        // ── Supabase Auth & Data Loading ──
        let channel;

        async function fetchProfile(userId) {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
            return data
        }

        async function loadDataAndSubscribe(userId) {
            try {
                const [colRes, salesRes, expRes, settRes, profileData] = await Promise.all([
                    supabase.from('collections').select('*').order('date', { ascending: false }),
                    supabase.from('sales').select('*').order('date', { ascending: false }),
                    supabase.from('expenses').select('*').order('date', { ascending: false }),
                    supabase.from('settings').select('*').eq('id', 1).single(),
                    fetchProfile(userId)
                ])

                const filterByPen = (data) => {
                    if (profileData?.role === 'owner' && profileData?.assigned_pen) {
                        return data.filter(item => item.house === profileData.assigned_pen)
                    }
                    return data
                }

                if (colRes.data) dispatch({ type: 'SET_COLLECTIONS', payload: filterByPen(colRes.data.map(fromDbCollection)) })
                if (salesRes.data) dispatch({ type: 'SET_SALES', payload: filterByPen(salesRes.data.map(fromDbSale)) })
                if (expRes.data) dispatch({ type: 'SET_EXPENSES', payload: filterByPen(expRes.data.map(fromDbExpense)) })
                if (settRes.data) dispatch({ type: 'SET_SETTINGS', payload: fromDbSettings(settRes.data) })

                // Setup Real-time subscriptions only after data is loaded
                channel = supabase.channel('eggledger-realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, async () => {
                        const { data } = await supabase.from('collections').select('*').order('date', { ascending: false })
                        if (data) dispatch({ type: 'SET_COLLECTIONS', payload: data.map(fromDbCollection) })
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
                        const { data } = await supabase.from('sales').select('*').order('date', { ascending: false })
                        if (data) dispatch({ type: 'SET_SALES', payload: data.map(fromDbSale) })
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, async () => {
                        const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false })
                        if (data) dispatch({ type: 'SET_EXPENSES', payload: data.map(fromDbExpense) })
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async () => {
                        const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
                        if (data) dispatch({ type: 'SET_SETTINGS', payload: fromDbSettings(data) })
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, async () => {
                        const updatedProfile = await fetchProfile(userId)
                        if (updatedProfile) dispatch({ type: 'SET_USER', payload: { user: state.user, profile: updatedProfile } })
                    })
                    .subscribe()

                return profileData
            } catch (err) {
                console.error('Supabase fetch error:', err)
                return null
            }
        }

        // Set up auth listener
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadDataAndSubscribe(session.user.id).then(profile => {
                    dispatch({ type: 'SET_USER', payload: { user: session.user, profile } })
                    dispatch({ type: 'SET_LOADING', payload: false })
                })
            } else {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadDataAndSubscribe(session.user.id).then(profile => {
                    dispatch({ type: 'SET_USER', payload: { user: session.user, profile } })
                })
            } else {
                if (channel) supabase.removeChannel(channel)
                dispatch({ type: 'SIGN_OUT' })
            }
        })

        return () => {
            subscription.unsubscribe()
            if (channel) supabase.removeChannel(channel)
        }
    }, [useSupabase])

    // ── Local storage sync (fallback) ──
    useEffect(() => {
        if (isLocal.current && !state.loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                collections: state.collections,
                sales: state.sales,
                expenses: state.expenses,
                settings: state.settings
            }))
        }
    }, [state])

    // ── Dispatch wrapper: routes actions to Supabase or local reducer ──
    const supabaseDispatch = useCallback(async (action) => {
        if (!useSupabase) {
            dispatch(action)
            return
        }

        try {
            switch (action.type) {
                case 'ADD_COLLECTION': {
            const { error } = await supabase.from('collections').insert(toDb(action.payload, 'collection'))
            if (error) throw error
            break
        }
        case 'DELETE_COLLECTION': {
            const { error } = await supabase.from('collections').delete().eq('id', action.payload)
            if (error) throw error
            break
        }
        case 'UPDATE_COLLECTION': {
            const updateData = toDb(action.payload.data, 'collection')
            const { error } = await supabase.from('collections').update(updateData).eq('id', action.payload.id)
            if (error) throw error
            break
        }
        case 'ADD_SALE': {
            const { error } = await supabase.from('sales').insert(toDb(action.payload, 'sale'))
            if (error) throw error
            break
        }
        case 'DELETE_SALE': {
            const { error } = await supabase.from('sales').delete().eq('id', action.payload)
            if (error) throw error
            break
        }
        case 'UPDATE_SALE': {
            const updateData = toDb(action.payload.data, 'sale')
            const { error } = await supabase.from('sales').update(updateData).eq('id', action.payload.id)
            if (error) throw error
            break
        }
        case 'ADD_EXPENSE': {
            const { error } = await supabase.from('expenses').insert(toDb(action.payload, 'expense'))
            if (error) throw error
            break
        }
        case 'DELETE_EXPENSE': {
            const { error } = await supabase.from('expenses').delete().eq('id', action.payload)
            if (error) throw error
            break
        }
        case 'UPDATE_EXPENSE': {
            const updateData = toDb(action.payload.data, 'expense')
            const { error } = await supabase.from('expenses').update(updateData).eq('id', action.payload.id)
            if (error) throw error
            break
        }
                case 'UPDATE_SETTINGS': {
                    const dbSettings = {
                        farm_name: action.payload.farmName,
                        eggs_per_crate: action.payload.eggsPerCrate,
                        default_price_per_crate: action.payload.defaultPricePerCrate,
                        currency: action.payload.currency,
                        updated_at: new Date().toISOString()
                    }
                    // Remove undefined values
                    Object.keys(dbSettings).forEach(k => dbSettings[k] === undefined && delete dbSettings[k])
                    const { error } = await supabase.from('settings').update(dbSettings).eq('id', 1)
                    if (error) throw error
                    break
                }
                case 'CLEAR_ALL': {
                    await Promise.all([
                        supabase.from('collections').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('settings').update({
                            farm_name: defaultSettings.farmName,
                            eggs_per_crate: defaultSettings.eggsPerCrate,
                            default_price_per_crate: defaultSettings.defaultPricePerCrate,
                            currency: defaultSettings.currency
                        }).eq('id', 1)
                    ])
                    break
                }
                case 'IMPORT_DATA': {
                    // Insert imported data
                    if (action.payload.collections?.length) {
                        const rows = action.payload.collections.map(c => toDb(c, 'collection'))
                        await supabase.from('collections').insert(rows)
                    }
                    if (action.payload.sales?.length) {
                        const rows = action.payload.sales.map(s => toDb(s, 'sale'))
                        await supabase.from('sales').insert(rows)
                    }
                    if (action.payload.expenses?.length) {
                        const rows = action.payload.expenses.map(e => toDb(e, 'expense'))
                        await supabase.from('expenses').insert(rows)
                    }
                    if (action.payload.settings) {
                        await supabase.from('settings').update({
                            farm_name: action.payload.settings.farmName || defaultSettings.farmName,
                            eggs_per_crate: action.payload.settings.eggsPerCrate || defaultSettings.eggsPerCrate,
                            default_price_per_crate: action.payload.settings.defaultPricePerCrate || defaultSettings.defaultPricePerCrate,
                            currency: action.payload.settings.currency || defaultSettings.currency
                        }).eq('id', 1)
                    }
                    break
                }
                default:
                    dispatch(action)
            }
        } catch (err) {
            console.error('Supabase action error:', err)
            // Fall back to local dispatch so UI stays responsive
            dispatch(action)
        }
    }, [useSupabase])

    return (
        <FarmContext.Provider value={{ state, dispatch: supabaseDispatch, isSupabase: useSupabase }}>
            {children}
        </FarmContext.Provider>
    )
}

export function useFarm() {
    const context = useContext(FarmContext)
    if (!context) throw new Error('useFarm must be used within FarmProvider')
    return context
}

export { defaultSettings, EXPENSE_CATEGORIES }
