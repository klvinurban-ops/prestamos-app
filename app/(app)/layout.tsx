import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import TopNavbar from '@/components/TopNavbar'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <TopNavbar userEmail={user?.email} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  )
}
