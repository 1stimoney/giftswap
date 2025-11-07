import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// ✅ PATCH: update user info (balance / suspension)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params // 👈 must await params now
  const body = await req.json()

  try {
    const { error } = await supabase.from('profiles').update(body).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ✅ DELETE: remove from profiles + auth
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    // Delete from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    if (profileError) throw profileError

    // Delete from auth (optional, requires service role key)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${id}`,
      {
        method: 'DELETE',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    )

    if (!res.ok) throw new Error('Failed to delete user from auth')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
