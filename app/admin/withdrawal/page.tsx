'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import styles from './withdrawal.module.css'

interface Bank {
  id: string
  bank_name: string
  account_number: string
  account_name: string
}

interface User {
  id: string
  username: string
  email: string
  balance: number
}

interface Withdrawal {
  id: string
  amount: number
  status: string
  created_at: string
  user: User
  bank: Bank
}

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(
          `
          id,
          amount,
          status,
          created_at,
          user:profiles(id, username, email, balance),
          bank:user_bank_info(id, bank_name, account_number, account_name)
        `
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      setWithdrawals(data)
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const handleUpdateStatus = async (
    withdrawal: Withdrawal,
    newStatus: 'approved' | 'rejected'
  ) => {
    try {
      // Only deduct balance if approved
      if (newStatus === 'approved') {
        const newBalance = withdrawal.user.balance - withdrawal.amount
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', withdrawal.user.id)
        if (balanceError) throw balanceError
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: newStatus })
        .eq('id', withdrawal.id)
      if (updateError) throw updateError

      alert('Withdrawal updated successfully')
      fetchWithdrawals()
    } catch (err) {
      console.error(err)
      alert('Failed to update withdrawal')
    }
  }

  if (loading) return <p>Loading withdrawals...</p>

  if (withdrawals.length === 0) return <p>No withdrawals found</p>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Withdrawal Requests</h1>
      <div className={styles.list}>
        {withdrawals.map((w) => (
          <div key={w.id} className={styles.card}>
            <div className={styles.info}>
              <p>
                <strong>User:</strong> {w.user.username} ({w.user.email})
              </p>
              <p>
                <strong>Bank:</strong> {w.bank.bank_name} -{' '}
                {w.bank.account_number} ({w.bank.account_name})
              </p>
              <p>
                <strong>Amount:</strong> ₦{w.amount.toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {w.status}
              </p>
              <p>
                <strong>Date:</strong> {new Date(w.created_at).toLocaleString()}
              </p>
            </div>
            {w.status === 'pending' && (
              <div className={styles.actions}>
                <button
                  className={styles.approveBtn}
                  onClick={() => handleUpdateStatus(w, 'approved')}
                >
                  Approve
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleUpdateStatus(w, 'rejected')}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
