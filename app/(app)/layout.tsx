import { createServerSupabase } from '@/lib/supabaseServer'
import AppShell from '@/components/AppShell'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell userEmail={user?.email}>{children}</AppShell>
  )
}
