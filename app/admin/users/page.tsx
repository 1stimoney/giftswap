'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  username: string
  full_name?: string
  email: string
  balance: number
  is_suspended: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newBalance, setNewBalance] = useState<string>('')

  // 🔹 Fetch all users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, balance, is_suspended')
        .order('username', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()

    // ✅ Real-time updates
    const channel = supabase
      .channel('profiles-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => await fetchUsers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 🔹 Suspend / Unsuspend User
  const handleSuspend = async (id: string, suspend: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: suspend }),
      })

      if (!res.ok) throw new Error('Failed to update user')
      toast.success(
        `User ${suspend ? 'suspended' : 'unsuspended'} successfully`
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to suspend user')
    }
  }

  // 🔹 Delete user (auth + profile)
  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this user permanently?'))
      return

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      toast.success('User deleted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete user')
    }
  }

  // 🔹 Update user balance
  const handleBalanceUpdate = async () => {
    if (!selectedUser || !newBalance) return

    try {
      const balanceValue = parseFloat(newBalance)
      if (isNaN(balanceValue)) {
        toast.error('Please enter a valid number')
        return
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: balanceValue }),
      })

      if (!res.ok) throw new Error('Failed to update balance')
      toast.success('Balance updated successfully')
      setSelectedUser(null)
      setNewBalance('')
    } catch (err) {
      console.error(err)
      toast.error('Error updating balance')
    }
  }

  // 🔹 UI Rendering
  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='animate-spin text-blue-600 w-6 h-6 mr-2' />
        <p className='text-gray-600 font-medium'>Loading users...</p>
      </div>
    )

  if (users.length === 0)
    return (
      <div className='flex justify-center items-center min-h-screen text-gray-600 text-lg'>
        No users found
      </div>
    )

  return (
    <div className='max-w-6xl mx-auto py-10 px-4'>
      <h1 className='text-3xl font-bold mb-8 text-gray-900'>
        👥 Users Management
      </h1>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {users.map((user) => (
          <Card
            key={user.id}
            className='shadow-sm border border-gray-200 hover:shadow-md transition-all'
          >
            <CardHeader>
              <CardTitle className='text-lg font-semibold flex justify-between items-center'>
                <span>{user.username || 'Unnamed User'}</span>
                <Badge variant={user.is_suspended ? 'destructive' : 'default'}>
                  {user.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-3 text-sm text-gray-700'>
              <p>
                <span className='font-semibold'>Full Name:</span>{' '}
                {user.full_name || '—'}
              </p>
              <p>
                <span className='font-semibold'>Email:</span> {user.email}
              </p>
              <p>
                <span className='font-semibold'>Balance:</span> ₦
                {user.balance?.toLocaleString()}
              </p>

              <div className='flex gap-2 pt-3'>
                <Button
                  onClick={() => setSelectedUser(user)}
                  className='bg-blue-600 text-white hover:bg-blue-700 flex-1'
                >
                  Edit Balance
                </Button>
                <Button
                  onClick={() => handleSuspend(user.id, !user.is_suspended)}
                  className={`flex-1 ${
                    user.is_suspended
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white`}
                >
                  {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                </Button>
                <Button
                  onClick={() => handleDelete(user.id)}
                  className='bg-red-600 hover:bg-red-700 text-white flex-1'
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 🔹 Balance Edit Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Balance for {selectedUser?.username}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <Input
              type='number'
              placeholder='Enter new balance amount'
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleBalanceUpdate}
                className='bg-blue-600 text-white hover:bg-blue-700'
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
