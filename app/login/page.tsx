'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🟦 Attempting login...')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('🟥 Login error:', error.message)
      setError(error.message)
      setLoading(false)
      return
    }

    console.log('🟩 Login success:', data)

    const user = data.user
    if (!user) {
      setError('No user returned from Supabase.')
      setLoading(false)
      return
    }

    // ✅ Wait for Supabase to persist session before fetching profile
    await new Promise((resolve) => setTimeout(resolve, 300))

    // ✅ Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('🟪 Profile fetched:', profile)

    if (profileError) {
      console.error('🟥 Profile fetch error:', profileError.message)
      setError('Error fetching user role')
      setLoading(false)
      return
    }

    if (!profile) {
      setError('Profile not found for this user')
      setLoading(false)
      return
    }

    // ✅ Redirect
    if (profile.role === 'admin') {
      console.log('🟨 Redirecting to /admin')
      setLoading(false)
      await router.refresh() // refresh router state
      router.replace('/admin')
      return
    }

    setError('You are not authorized to access the admin panel.')
    setLoading(false)
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <Card className='w-full max-w-sm shadow-lg'>
        <CardHeader>
          <CardTitle className='text-center text-xl font-semibold'>
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className='space-y-4'>
            <Input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
