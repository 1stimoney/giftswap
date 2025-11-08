/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id?: string
    name?: string
    rate?: number
    image_url?: string | null
  } | null
}

export default function GiftCardModal({
  open,
  onOpenChange,
  initialData,
}: Props) {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setRate(initialData.rate?.toString() || '')
      setImageUrl(initialData.image_url || '')
    } else {
      setName('')
      setRate('')
      setImageUrl('')
    }
  }, [initialData, open])

  const handleSave = async () => {
    if (!name.trim() || !rate) {
      toast.error('Name and rate are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        rate: Number(rate),
        image_url: imageUrl?.trim() || null,
      }

      let res: Response
      if (initialData?.id) {
        res = await fetch(`/api/admin/giftcards/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/giftcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to save')
      }

      toast.success('Saved')
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to save gift card')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Edit Gift Card' : 'Add Gift Card'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 mt-2'>
          <label className='block'>
            <div className='text-sm font-medium mb-1'>Card Name</div>
            <Input
              value={name}
              onChange={(e: any) => setName(e.target.value)}
            />
          </label>

          <label className='block'>
            <div className='text-sm font-medium mb-1'>Rate (₦ per $)</div>
            <Input
              value={rate}
              onChange={(e: any) => setRate(e.target.value)}
            />
          </label>

          <label className='block'>
            <div className='text-sm font-medium mb-1'>Image URL (optional)</div>
            <Input
              value={imageUrl}
              onChange={(e: any) => setImageUrl(e.target.value)}
            />
          </label>

          <div className='flex gap-2 justify-end'>
            <Button
              variant='ghost'
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className='bg-blue-600 hover:bg-blue-700'
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
