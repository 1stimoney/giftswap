import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ must use service role key for admin ops
)

async function seedAdmin() {
  const email = 'admin@giftswap.com'
  const password = 'Admin123!' // You can change this
  const username = 'SuperAdmin'

  console.log('🔹 Checking if admin exists...')
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .maybeSingle()

  if (existing) {
    console.log('✅ Admin already exists:', existing.username)
    return
  }

  console.log('⚙️ Creating admin user...')
  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (signUpError) {
    console.error('❌ Error creating admin user:', signUpError.message)
    return
  }

  if (!user.user) {
    console.error('❌ Failed to create admin user — no user returned.')
    return
  }

  console.log('✅ Created user. Setting role to admin...')
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.user.id,
    username,
    role: 'admin',
  })

  if (profileError) {
    console.error('❌ Error updating profile:', profileError.message)
    return
  }

  console.log('🎉 Admin created successfully!')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

seedAdmin()
