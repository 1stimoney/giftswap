/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface Trade {
  id: string
  user_id: string
  user_name: string
  user_email: string
  card_name: string
  rate: number
  amount_usd: number
  total: number
  image_url?: string
  image_urls?: string[] | string
  status: string
  created_at: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchTrades()

    const channel = supabase
      .channel('public:trades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        (payload) => {
          console.log('📡 Realtime change:', payload)
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe(async (status) => {
        console.log('Realtime channel status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to trades realtime updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades', { cache: 'no-store' })
      if (!res.ok) {
        setError('Failed to fetch trades')
        return
      }

      const data = await res.json()
      if (Array.isArray(data)) setTrades(data)
      else setError('Invalid data format')
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError('Error fetching trades')
    } finally {
      setLoading(false)
    }
  }

  // 🧩 Handle real-time insert/update/delete
  const handleRealtimeUpdate = (payload: any) => {
    setTrades((prevTrades) => {
      const eventType = payload.eventType
      const newTrade = payload.new
      const oldTrade = payload.old

      if (eventType === 'INSERT') {
        return [newTrade, ...prevTrades]
      }

      if (eventType === 'UPDATE') {
        return prevTrades.map((t) => (t.id === newTrade.id ? newTrade : t))
      }

      if (eventType === 'DELETE') {
        return prevTrades.filter((t) => t.id !== oldTrade.id)
      }

      return prevTrades
    })
  }

  const updateTradeStatus = async (tradeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Failed to update trade:', errText)
        return alert('Failed to update trade status')
      }

      alert('✅ Trade status updated successfully')
    } catch (error) {
      console.error('Error updating trade:', error)
      alert('An error occurred while updating trade status')
    }
  }

  const parseImageUrls = (trade: Trade): string[] => {
    try {
      if (Array.isArray(trade.image_urls)) return trade.image_urls
      if (typeof trade.image_urls === 'string') {
        const parsed = JSON.parse(trade.image_urls)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (err) {
      console.warn('Error parsing image_urls:', err)
    }
    return trade.image_url ? [trade.image_url] : []
  }

  // 🌀 Loading and Error States
  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-6 h-6 text-blue-600 animate-spin mr-2' />
        <p className='text-gray-600 font-medium'>Loading trades...</p>
      </div>
    )

  if (error)
    return (
      <div className='flex justify-center items-center min-h-screen text-red-600 text-lg'>
        {error}
      </div>
    )

  if (trades.length === 0)
    return (
      <div className='flex justify-center items-center min-h-screen text-gray-600 text-lg'>
        No trades found
      </div>
    )

  return (
    <div className='max-w-7xl mx-auto py-10 px-4'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900 text-center'>
        💱 All Trades
      </h1>

      <div className='overflow-x-auto bg-white shadow rounded-xl border border-gray-200'>
        <table className='min-w-full border-collapse text-sm'>
          <thead className='bg-gray-50'>
            <tr className='text-left text-gray-700 font-semibold'>
              <th className='p-4'>User</th>
              <th className='p-4'>Email</th>
              <th className='p-4'>Card</th>
              <th className='p-4'>Rate</th>
              <th className='p-4'>Amount (USD)</th>
              <th className='p-4'>Total (NGN)</th>
              <th className='p-4'>Status</th>
              <th className='p-4'>Date</th>
              <th className='p-4'>Images</th>
              <th className='p-4'>Action</th>
            </tr>
          </thead>

          <tbody>
            {trades.map((trade) => {
              const images = parseImageUrls(trade)

              return (
                <tr
                  key={trade.id}
                  className='border-t border-gray-100 hover:bg-gray-50 transition-all'
                >
                  <td className='p-4 font-medium'>{trade.user_name}</td>
                  <td className='p-4 text-gray-700'>{trade.user_email}</td>
                  <td className='p-4'>{trade.card_name}</td>
                  <td className='p-4'>₦{trade.rate}</td>
                  <td className='p-4'>${trade.amount_usd}</td>
                  <td className='p-4 font-semibold text-gray-900'>
                    ₦{trade.total.toLocaleString()}
                  </td>
                  <td className='p-4'>
                    <Badge
                      variant={
                        trade.status === 'approved'
                          ? 'default'
                          : trade.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={`${
                        trade.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : ''
                      }`}
                    >
                      {trade.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className='p-4'>
                    {new Date(trade.created_at).toLocaleString()}
                  </td>
                  <td className='p-4'>
                    {images.length > 0 ? (
                      <div className='flex gap-2 overflow-x-auto max-w-[200px]'>
                        {images.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Trade ${trade.id} image ${i + 1}`}
                            className='w-14 h-14 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition'
                            onClick={() => setSelectedImage(url)}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className='text-gray-400 text-sm'>No image</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {trade.status === 'pending' && (
                      <div className='flex gap-2'>
                        <Button
                          onClick={() =>
                            updateTradeStatus(trade.id, 'approved')
                          }
                          className='bg-green-600 text-white hover:bg-green-700'
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() =>
                            updateTradeStatus(trade.id, 'rejected')
                          }
                          className='bg-red-600 text-white hover:bg-red-700'
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 🖼️ Image Preview Modal */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Trade Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt='Preview'
              className='w-full h-auto rounded-lg shadow-md'
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
