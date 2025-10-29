// app/admin/page.tsx
import { createClient } from '@/lib/supabaseClient'

export default async function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  const { count: tradesCount } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
  const { count: withdrawCount } = await supabase
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <h1 className='text-2xl font-bold mb-4'>Dashboard Overview</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white rounded-xl shadow-sm p-6'>
          <p className='text-sm text-gray-500'>Total Users</p>
          <h2 className='text-3xl font-semibold'>{usersCount}</h2>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-6'>
          <p className='text-sm text-gray-500'>Total Trades</p>
          <h2 className='text-3xl font-semibold'>{tradesCount}</h2>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-6'>
          <p className='text-sm text-gray-500'>Total Withdrawals</p>
          <h2 className='text-3xl font-semibold'>{withdrawCount}</h2>
        </div>
      </div>
    </div>
  )
}
