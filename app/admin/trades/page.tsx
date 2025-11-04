'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades', { cache: 'no-store' })
      const contentType = res.headers.get('content-type')

      if (!res.ok) {
        setError('Failed to fetch trades')
        return
      }

      if (contentType?.includes('application/json')) {
        const data = await res.json()
        if (Array.isArray(data)) setTrades(data)
        else setError('Invalid data format')
      } else {
        setError('Unexpected response type')
      }
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError('Error fetching trades')
    } finally {
      setLoading(false)
    }
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

      alert('Trade status updated successfully ✅')
      fetchTrades()
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
