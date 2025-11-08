/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import GiftCardModal from '@/components/admin/GiftCardModal'
import { supabase } from '@/lib/supabaseClient'

interface GiftCard {
  id: string
  name: string
  rate: number
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

export default function GiftCardsAdminPage() {
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GiftCard | null>(null)

  const fetchCards = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/giftcards', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load gift cards')
      const data = await res.json()
      setCards(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load gift cards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()

    // realtime subscription: updates when a row is inserted/updated/deleted
    const channel = supabase
      .channel('giftcards-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gift_cards' },
        (payload) => {
          // prefer re-fetch for simplicity and accuracy
          fetchCards()
          if (payload.eventType === 'INSERT') {
            toast(`🆕 Gift card added: ${payload.new.name}`)
          } else if (payload.eventType === 'UPDATE') {
            toast(`✏️ Gift card updated: ${payload.new.name}`)
          } else if (payload.eventType === 'DELETE') {
            toast(`🗑️ Gift card deleted`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (card: GiftCard) => {
    setEditing(card)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gift card?')) return
    try {
      const res = await fetch(`/api/admin/giftcards/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Gift card deleted')
      fetchCards()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete gift card')
    }
  }

  return (
    <div className='max-w-6xl mx-auto py-10 px-4'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold'>Gift Cards</h1>
        <div>
          <Button onClick={openAdd} className='bg-blue-600 hover:bg-blue-700'>
            Add New Card
          </Button>
        </div>
      </div>

      {loading ? (
        <p className='text-center text-gray-500'>Loading...</p>
      ) : cards.length === 0 ? (
        <p className='text-center text-gray-500'>No gift cards found</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {cards.map((c) => (
            <Card key={c.id} className='hover:shadow-md transition'>
              <CardHeader>
                <CardTitle className='flex justify-between items-center'>
                  <span>{c.name}</span>
                  <span className='text-sm text-muted-foreground'>
                    ₦{c.rate}/$
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='mb-3 h-28 w-full flex items-center justify-center bg-gray-50 rounded-md overflow-hidden'>
                  {c.image_url ? (
                    // keep simple img tag so Next/image config won't block
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className='max-h-28 object-contain'
                    />
                  ) : (
                    <div className='text-gray-400'>No image URL</div>
                  )}
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={() => openEdit(c)}
                    className='flex-1 bg-yellow-500 hover:bg-yellow-600'
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(c.id)}
                    className='flex-1 bg-red-600 hover:bg-red-700'
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* modal (add/edit) */}
      <GiftCardModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v)
          if (!v) setEditing(null)
          if (!v) fetchCards()
        }}
        initialData={editing}
      />
    </div>
  )
}
