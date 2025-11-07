/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'

export function AdminRealtimeListener() {
  useEffect(() => {
    // ✅ Listen for new withdrawals
    const withdrawalsChannel = supabase
      .channel('withdrawals-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'withdrawals' },
        (payload) => {
          const w = payload.new as any
          toast.info(
            `💸 New withdrawal request: ₦${w.amount?.toLocaleString()}`,
            {
              description: `User ID: ${w.user_id}`,
              duration: 6000,
            }
          )
        }
      )
      .subscribe()

    // ✅ Listen for new trades (optional)
    const tradesChannel = supabase
      .channel('trades-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades' },
        (payload) => {
          const t = payload.new as any
          toast.info(`🪙 New trade request: ${t.card_name}`, {
            description: `Amount: $${t.amount_usd} (${t.user_email})`,
            duration: 6000,
          })
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(withdrawalsChannel)
      supabase.removeChannel(tradesChannel)
    }
  }, [])

  // This component doesn’t render anything visible
  return null
}
