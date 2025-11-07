'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

  // ✅ Fetch withdrawals
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
      setWithdrawals(data as unknown as Withdrawal[])
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
      toast.error('Failed to load withdrawals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Update withdrawal status
  const handleUpdateStatus = async (
    withdrawal: Withdrawal,
    newStatus: 'approved' | 'rejected'
  ) => {
    try {
      toast.loading(`Processing ${newStatus} request...`)

      // If approved, deduct user balance
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

      toast.dismiss()
      toast.success(`Withdrawal ${newStatus} successfully.`)
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error('Failed to update withdrawal. Please try again.')
    }
  }

  // ✅ Initial fetch
  useEffect(() => {
    fetchWithdrawals()
  }, [])

  // ✅ Real-time updates using Supabase channel
  useEffect(() => {
    const channel = supabase
      .channel('withdrawals-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        async (payload) => {
          console.log('Realtime update received:', payload)
          await fetchWithdrawals()

          // Show a toast when new withdrawal is added
          if (payload.eventType === 'INSERT') {
            toast.info('New withdrawal request received.')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ UI rendering
  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='animate-spin text-blue-600 w-6 h-6 mr-2' />
        <p className='text-gray-600 font-medium'>Loading withdrawals...</p>
      </div>
    )

  if (withdrawals.length === 0)
    return (
      <div className='flex justify-center items-center min-h-screen text-gray-600 text-lg'>
        No withdrawals found
      </div>
    )

  return (
    <div className='max-w-6xl mx-auto py-10 px-4'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900'>
        💳 Withdrawal Requests
      </h1>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {withdrawals.map((w) => (
          <Card
            key={w.id}
            className='shadow-sm border border-gray-200 hover:shadow-md transition-all'
          >
            <CardHeader>
              <CardTitle className='text-lg font-semibold flex justify-between items-center'>
                <span>{w.user.username}</span>
                <Badge
                  variant={
                    w.status === 'approved'
                      ? 'default'
                      : w.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={
                    w.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : ''
                  }
                >
                  {w.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-3 text-sm text-gray-700'>
              <p>
                <span className='font-semibold'>Email:</span> {w.user.email}
              </p>
              <p>
                <span className='font-semibold'>Bank:</span> {w.bank.bank_name}{' '}
                — {w.bank.account_number} ({w.bank.account_name})
              </p>
              <p>
                <span className='font-semibold'>Amount:</span> ₦
                {w.amount.toLocaleString()}
              </p>
              <p>
                <span className='font-semibold'>Date:</span>{' '}
                {new Date(w.created_at).toLocaleString()}
              </p>

              {w.status === 'pending' && (
                <div className='flex gap-3 pt-3'>
                  <Button
                    onClick={() => handleUpdateStatus(w, 'approved')}
                    className='bg-green-600 hover:bg-green-700 text-white flex-1'
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(w, 'rejected')}
                    className='bg-red-600 hover:bg-red-700 text-white flex-1'
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
