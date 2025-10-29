// components/admin/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, CreditCard, Banknote } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/trades', label: 'Trades', icon: CreditCard },
  { href: '/admin/withdrawal', label: 'Withdrawals', icon: Banknote },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className='w-64 border-r bg-white shadow-sm hidden md:flex flex-col'>
      <div className='px-6 py-4 text-2xl font-semibold border-b'>
        GiftSwap Admin
      </div>
      <nav className='flex-1 p-4 space-y-2'>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
