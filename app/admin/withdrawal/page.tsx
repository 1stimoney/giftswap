/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  username: string
  email: string
}

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWithdrawals()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public:withdrawals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload) => {
          console.log('Realtime event:', payload)
          fetchWithdrawals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(
          `
          id,
          user_id,
          amount,
          status,
          created_at,
          profiles!inner(username,email)
        `
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = data?.map((w: any) => ({
        id: w.id,
        user_id: w.user_id,
        amount: w.amount,
        status: w.status,
        created_at: w.created_at,
        username: w.profiles.username,
        email: w.profiles.email,
      }))

      setWithdrawals(mapped || [])
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (
    withdrawalId: string,
    status: string,
    userId: string,
    amount: number
  ) => {
    try {
      if (status === 'approved') {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single()
        if (profileError) throw profileError

        const currentBalance = profileData.balance || 0
        const newBalance = currentBalance - amount

        if (newBalance < 0)
          return alert('Cannot approve: user has insufficient balance.')

        const { error: updateBalanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId)
        if (updateBalanceError) throw updateBalanceError
      }

      const { error: updateStatusError } = await supabase
        .from('withdrawals')
        .update({ status })
        .eq('id', withdrawalId)
      if (updateStatusError) throw updateStatusError

      alert(`Withdrawal ${status}`)
      fetchWithdrawals()
    } catch (err) {
      console.error('Error updating withdrawal:', err)
      alert('Failed to update withdrawal')
    }
  }

  if (loading) return <p>Loading withdrawals...</p>
  if (withdrawals.length === 0) return <p>No withdrawal requests found.</p>

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Withdrawal Requests
      </h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th>User</th>
            <th>Email</th>
            <th>Amount (₦)</th>
            <th>Status</th>
            <th>Requested At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{w.username}</td>
              <td>{w.email}</td>
              <td>{w.amount.toLocaleString()}</td>
              <td>{w.status}</td>
              <td>{new Date(w.created_at).toLocaleString()}</td>
              <td>
                {w.status === 'pending' && (
                  <>
                    <button
                      style={{
                        marginRight: 10,
                        padding: '5px 10px',
                        backgroundColor: 'green',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        handleUpdate(w.id, 'approved', w.user_id, w.amount)
                      }
                    >
                      Approve
                    </button>
                    <button
                      style={{
                        padding: '5px 10px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        handleUpdate(w.id, 'rejected', w.user_id, w.amount)
                      }
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
