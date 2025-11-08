/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/giftcards/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseSever' // <-- server-side supabase client (adjust path)

export async function GET() {
  const { data, error } = await supabase
    .from('gift_cards')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, rate, image_url } = body
    const { data, error } = await supabase
      .from('gift_cards')
      .insert([{ name, rate, image_url }])
      .select()
      .single()
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Bad request' },
      { status: 400 }
    )
  }
}
