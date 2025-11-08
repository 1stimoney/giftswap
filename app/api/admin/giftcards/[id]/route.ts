/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/giftcards/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseSever'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params // ✅ FIXED: Await params
  try {
    const body = await req.json()
    const { name, rate, image_url } = body

    const { data, error } = await supabase
      .from('gift_cards')
      .update({ name, rate, image_url })
      .eq('id', id)
      .select()
      .single()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Bad request' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params // ✅ FIXED: Await params
  const { error } = await supabase.from('gift_cards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
