'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

  // ✅ Fetch trades from API
  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch trades')

      const data = await res.json()
      setTrades(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError('Failed to load trades')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Update trade status
  const updateTradeStatus = async (tradeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        console.error('Failed to update trade')
        toast.error('Failed to update trade status')
        return
      }

      toast.success(`✅ Trade marked as ${newStatus}`)
      setTrades((prev) =>
        prev.map((t) => (t.id === tradeId ? { ...t, status: newStatus } : t))
      )
    } catch (err) {
      console.error(err)
      toast.error('An error occurred while updating trade status')
    }
  }

  // ✅ Parse image URLs
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

  // ✅ Subscribe to realtime changes
  useEffect(() => {
    fetchTrades()

    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades' },
        (payload) => {
          console.log('📡 Realtime payload:', payload)

          if (payload.eventType === 'INSERT') {
            const newTrade = payload.new as Trade
            toast.info(`🆕 New trade from ${newTrade.user_name}`)
            setTrades((prev) => {
              const exists = prev.some((t) => t.id === newTrade.id)
              return exists ? prev : [newTrade, ...prev]
            })
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Trade
            toast.success(`🔄 Trade updated (${updated.status})`)
            setTrades((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            )
          }

          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Trade
            setTrades((prev) => prev.filter((t) => t.id !== deleted.id))
            toast.warning(`🗑️ Trade deleted: ${deleted.card_name}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 🔁 Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔁 Auto-refreshing trades...')
      fetchTrades()
    }, 10000) // every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // ✅ UI Rendering
  if (loading) return <p className='text-center py-10'>Loading trades...</p>
  if (error) return <p className='text-center text-red-500 py-10'>{error}</p>
  if (trades.length === 0)
    return <p className='text-center py-10'>No trades found</p>

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold mb-6 text-center'>All Trades</h1>

      <div className='overflow-x-auto'>
        <table className='min-w-full border border-gray-300 rounded-lg overflow-hidden'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='p-3 text-left'>User</th>
              <th className='p-3 text-left'>Email</th>
              <th className='p-3 text-left'>Card</th>
              <th className='p-3 text-left'>Rate</th>
              <th className='p-3 text-left'>Amount (USD)</th>
              <th className='p-3 text-left'>Total (NGN)</th>
              <th className='p-3 text-left'>Status</th>
              <th className='p-3 text-left'>Date</th>
              <th className='p-3 text-left'>Images</th>
              <th className='p-3 text-left'>Action</th>
            </tr>
          </thead>

          <tbody>
            {trades.map((trade) => {
              const images = parseImageUrls(trade)

              return (
                <tr key={trade.id} className='border-t hover:bg-gray-50'>
                  <td className='p-3'>{trade.user_name}</td>
                  <td className='p-3'>{trade.user_email}</td>
                  <td className='p-3'>{trade.card_name}</td>
                  <td className='p-3'>{trade.rate}</td>
                  <td className='p-3'>{trade.amount_usd}</td>
                  <td className='p-3 font-medium'>{trade.total}</td>
                  <td
                    className={`p-3 font-medium ${
                      trade.status === 'approved'
                        ? 'text-green-600'
                        : trade.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {trade.status}
                  </td>
                  <td className='p-3'>
                    {new Date(trade.created_at).toLocaleString()}
                  </td>
                  <td className='p-3'>
                    {images.length > 0 ? (
                      <div className='flex gap-2 overflow-x-auto max-w-[180px]'>
                        {images.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Trade ${trade.id} image ${i + 1}`}
                            className='w-16 h-16 object-cover rounded-md border cursor-pointer hover:opacity-80 transition'
                            onClick={() => setSelectedImage(url)}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className='text-gray-400 text-sm'>No image</span>
                    )}
                  </td>
                  <td className='p-3 flex gap-2'>
                    {trade.status === 'pending' && (
                      <>
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
                      </>
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
