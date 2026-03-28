import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getCurrentMonthYear() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useExpenses(monthYear = null) {
  const currentMonth = monthYear || getCurrentMonthYear()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  // Incrementing this triggers a re-fetch without calling setState inside the effect body
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  // Fetch whenever month or tick changes
  useEffect(() => {
    let cancelled = false

    supabase
      .from('expenses')
      .select('*')
      .eq('month_year', currentMonth)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setExpenses(data || [])
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [currentMonth, tick])

  // Realtime subscription — triggers refetch on any expense change
  useEffect(() => {
    const channel = supabase
      .channel(`expenses-${currentMonth}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => refetch()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentMonth, refetch])

  async function addExpense(amount, description, type) {
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('expenses').insert({
      user_id: session.user.id,
      amount,
      description,
      type,
      status: 'approved',
      month_year: currentMonth,
    })
    if (error) throw new Error(error.message)
    refetch()
  }

  async function updateExpenseStatus(id, status, rejectionReason = null) {
    const update = { status }
    if (rejectionReason) update.rejection_reason = rejectionReason
    const { error } = await supabase.from('expenses').update(update).eq('id', id)
    if (error) throw new Error(error.message)
    refetch()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    refetch()
  }

  const totals = expenses.reduce(
    (acc, exp) => {
      if (exp.type === 'expense') {
        acc.totalExpenses += exp.amount
        if (exp.status === 'approved') acc.approvedExpenses += exp.amount
        if (exp.status === 'rejected') acc.rejectedExpenses += exp.amount
        if (exp.status === 'pending') acc.pendingExpenses += exp.amount
      } else if (exp.type === 'cash_in') {
        acc.totalCashIn += exp.amount
      }
      return acc
    },
    { totalExpenses: 0, approvedExpenses: 0, rejectedExpenses: 0, pendingExpenses: 0, totalCashIn: 0 }
  )

  return {
    expenses,
    loading,
    totals,
    addExpense,
    updateExpenseStatus,
    deleteExpense,
    refetch,
  }
}

export function useSettings() {
  const [pocketMoney, setPocketMoney] = useState(12000)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('settings')
      .select('pocket_money')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setPocketMoney(data.pocket_money)
      })
      .catch(err => console.error('Settings fetch error:', err.message))
      .finally(() => setLoading(false))
  }, [])

  async function updatePocketMoney(amount) {
    const { data } = await supabase.from('settings').select('id').limit(1).single()
    if (!data) throw new Error('Settings not found')
    const { error } = await supabase
      .from('settings')
      .update({ pocket_money: amount, updated_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    setPocketMoney(amount)
  }

  return { pocketMoney, loading, updatePocketMoney }
}

export function useMonthList() {
  const [months, setMonths] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const current = getCurrentMonthYear()
    supabase
      .from('expenses')
      .select('month_year')
      .neq('month_year', current)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(d => d.month_year))].sort().reverse()
          setMonths(unique)
        }
      })
      .catch(err => console.error('Month list error:', err.message))
      .finally(() => setLoading(false))
  }, [])

  return { months, loading }
}
