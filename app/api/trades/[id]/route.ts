import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { status } = await req.json()

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing trade ID' }), {
      status: 400,
    })
  }

  // ✅ Step 1: Fetch trade details
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .select('id, user_id, total, status')
    .eq('id', id)
    .single()

  if (tradeError || !trade) {
    console.error('Trade not found:', tradeError)
    return new Response(JSON.stringify({ error: 'Trade not found' }), {
      status: 404,
    })
  }

  // ✅ Step 2: Update trade status
  const { error: updateError } = await supabase
    .from('trades')
    .update({ status })
    .eq('id', id)

  if (updateError) {
    console.error('Error updating trade status:', updateError)
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
    })
  }

  // ✅ Step 3: If approved, update user balance
  if (status === 'approved') {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', trade.user_id)
      .single()

    if (profileError || !profile) {
      console.error('User profile not found:', profileError)
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
      })
    }

    const newBalance = (profile.balance || 0) + (trade.total || 0)

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', trade.user_id)

    if (balanceError) {
      console.error('Error updating user balance:', balanceError)
      return new Response(JSON.stringify({ error: balanceError.message }), {
        status: 500,
      })
    }
  }

  return new Response(
    JSON.stringify({
      message: `Trade ${status} successfully ✅`,
      tradeId: id,
      newStatus: status,
    }),
    { status: 200 }
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'
