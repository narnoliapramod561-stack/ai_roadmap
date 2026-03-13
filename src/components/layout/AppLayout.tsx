import { Outlet, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { FloatingActions } from './FloatingActions'
import { useUserStore } from '@/stores/useUserStore'
import { useFocusStore } from '@/stores/useFocusStore'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const AppLayout = () => {
  const user = useUserStore((state) => state.user)
  const { isFocusMode, setFocusMode } = useFocusStore()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="min-h-screen bg-[#07070A] font-sans antialiased text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Focus Mode Exit Indicator */}
      {isFocusMode && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 backdrop-blur-xl rounded-full shadow-[0_0_30px_rgba(0,245,212,0.1)]">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Focus Mode Active</span>
          <button 
            onClick={() => setFocusMode(false)}
            className="hover:scale-110 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}

      {/* App-wide Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10">
        {!isFocusMode && <Navbar />}
        <div className={cn(
          "flex max-w-[1600px] mx-auto relative px-4 transition-all duration-500",
          isFocusMode ? "pt-20" : ""
        )}>
          {!isFocusMode && <Sidebar />}
          <main className={cn(
            "flex-1 p-8 lg:p-12 overflow-x-hidden min-h-[calc(100vh-8rem)] transition-all duration-500",
            isFocusMode ? "max-w-4xl mx-auto" : ""
          )}>
            <Outlet />
          </main>
        </div>
      </div>
      <FloatingActions />
    </div>
  )
}

