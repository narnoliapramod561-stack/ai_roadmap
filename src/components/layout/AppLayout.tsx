import { Outlet, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { FloatingActions } from './FloatingActions'
import { useUserStore } from '@/stores/useUserStore'

export const AppLayout = () => {
  const user = useUserStore((state) => state.user)

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <Navbar />
      <div className="flex max-w-[1600px] mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      <FloatingActions />
    </div>
  )
}

