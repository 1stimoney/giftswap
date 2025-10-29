/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*')
      setUsers(data || [])
    }
    fetchUsers()
  }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(users.filter((u) => u.id !== id))
  }

  return (
    <div>
      <h1 className='text-2xl font-semibold mb-4'>User Management</h1>
      <div className='overflow-x-auto bg-white rounded-xl shadow'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-gray-100 text-gray-600'>
            <tr>
              <th className='p-3'>Full Name</th>
              <th className='p-3'>Email</th>
              <th className='p-3'>Role</th>
              <th className='p-3 text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className='border-b hover:bg-gray-50'>
                <td className='p-3'>{u.full_name}</td>
                <td className='p-3'>{u.email}</td>
                <td className='p-3'>{u.role || 'user'}</td>
                <td className='p-3 text-right'>
                  <Button
                    variant='destructive'
                    onClick={() => handleDelete(u.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
