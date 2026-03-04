import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { db } from '../firebase'
import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore'

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
    collections: [],
    sales: [],
    expenses: [],
    settings: { ...defaultSettings },
    loading: true
}

// Check if Firebase is configured
function isFirebaseConfigured() {
    const key = import.meta.env.VITE_FIREBASE_API_KEY
    return key && key !== 'your-api-key-here' && key.length > 0
}

// Local storage fallback
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
                loading: false
            }
        }
    } catch (e) {
        console.error('Failed to load local state:', e)
    }
    return { ...initialState, loading: false }
}

function farmReducer(state, action) {
    switch (action.type) {
        case 'SET_COLLECTIONS':
            return { ...state, collections: action.payload }
        case 'SET_SALES':
            return { ...state, sales: action.payload }
        case 'SET_EXPENSES':
            return { ...state, expenses: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        // Local-only actions (fallback mode)
        case 'ADD_COLLECTION':
            return { ...state, collections: [{ id: Date.now().toString(), ...action.payload }, ...state.collections] }
        case 'DELETE_COLLECTION':
            return { ...state, collections: state.collections.filter(c => c.id !== action.payload) }
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

export function FarmProvider({ children }) {
    const useFirebase = isFirebaseConfigured()
    const [state, dispatch] = useReducer(farmReducer, null, () =>
        useFirebase ? initialState : loadLocalState()
    )
    const isLocal = useRef(!useFirebase)

    // --- Firestore real-time listeners ---
    useEffect(() => {
        if (!useFirebase) return

        const unsubscribers = []

        try {
            // Collections
            const colQ = query(collection(db, 'collections'), orderBy('date', 'desc'))
            unsubscribers.push(onSnapshot(colQ, (snap) => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                dispatch({ type: 'SET_COLLECTIONS', payload: data })
            }, (err) => {
                console.error('Firestore collections error:', err)
            }))

            // Sales
            const salesQ = query(collection(db, 'sales'), orderBy('date', 'desc'))
            unsubscribers.push(onSnapshot(salesQ, (snap) => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                dispatch({ type: 'SET_SALES', payload: data })
            }, (err) => {
                console.error('Firestore sales error:', err)
            }))

            // Expenses
            const expQ = query(collection(db, 'expenses'), orderBy('date', 'desc'))
            unsubscribers.push(onSnapshot(expQ, (snap) => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                dispatch({ type: 'SET_EXPENSES', payload: data })
            }, (err) => {
                console.error('Firestore expenses error:', err)
            }))

            // Settings
            unsubscribers.push(onSnapshot(doc(db, 'config', 'settings'), (snap) => {
                if (snap.exists()) {
                    dispatch({ type: 'UPDATE_SETTINGS', payload: snap.data() })
                }
                dispatch({ type: 'SET_LOADING', payload: false })
            }, (err) => {
                console.error('Firestore settings error:', err)
                dispatch({ type: 'SET_LOADING', payload: false })
            }))
        } catch (err) {
            console.error('Firebase init error:', err)
            dispatch({ type: 'SET_LOADING', payload: false })
        }

        return () => unsubscribers.forEach(unsub => unsub())
    }, [useFirebase])

    // --- Local storage sync (fallback mode) ---
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

    // --- Firestore actions ---
    const firebaseDispatch = useCallback(async (action) => {
        if (!useFirebase) {
            // Fallback to local reducer
            dispatch(action)
            return
        }

        try {
            switch (action.type) {
                case 'ADD_COLLECTION':
                    await addDoc(collection(db, 'collections'), action.payload)
                    break
                case 'DELETE_COLLECTION':
                    await deleteDoc(doc(db, 'collections', action.payload))
                    break
                case 'ADD_SALE':
                    await addDoc(collection(db, 'sales'), action.payload)
                    break
                case 'DELETE_SALE':
                    await deleteDoc(doc(db, 'sales', action.payload))
                    break
                case 'UPDATE_SALE':
                    await updateDoc(doc(db, 'sales', action.payload.id), action.payload.data)
                    break
                case 'ADD_EXPENSE':
                    await addDoc(collection(db, 'expenses'), action.payload)
                    break
                case 'DELETE_EXPENSE':
                    await deleteDoc(doc(db, 'expenses', action.payload))
                    break
                case 'UPDATE_SETTINGS':
                    const { setDoc } = await import('firebase/firestore')
                    await setDoc(doc(db, 'config', 'settings'), action.payload, { merge: true })
                    break
                case 'CLEAR_ALL': {
                    // Delete all documents in each collection
                    const { getDocs } = await import('firebase/firestore')
                    const colls = ['collections', 'sales', 'expenses']
                    for (const name of colls) {
                        const snap = await getDocs(collection(db, name))
                        const deletes = snap.docs.map(d => deleteDoc(doc(db, name, d.id)))
                        await Promise.all(deletes)
                    }
                    await setDoc(doc(db, 'config', 'settings'), defaultSettings)
                    break
                }
                case 'IMPORT_DATA': {
                    const { setDoc: setDocImport } = await import('firebase/firestore')
                    // Add all imported data
                    if (action.payload.collections) {
                        for (const item of action.payload.collections) {
                            const { id, ...data } = item
                            await addDoc(collection(db, 'collections'), data)
                        }
                    }
                    if (action.payload.sales) {
                        for (const item of action.payload.sales) {
                            const { id, ...data } = item
                            await addDoc(collection(db, 'sales'), data)
                        }
                    }
                    if (action.payload.expenses) {
                        for (const item of action.payload.expenses) {
                            const { id, ...data } = item
                            await addDoc(collection(db, 'expenses'), data)
                        }
                    }
                    if (action.payload.settings) {
                        await setDocImport(doc(db, 'config', 'settings'), {
                            ...defaultSettings,
                            ...action.payload.settings
                        })
                    }
                    break
                }
                default:
                    dispatch(action)
            }
        } catch (err) {
            console.error('Firebase action error:', err)
            // Fallback to local dispatch so UI still works
            dispatch(action)
        }
    }, [useFirebase])

    return (
        <FarmContext.Provider value={{ state, dispatch: firebaseDispatch, isFirebase: useFirebase }}>
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
