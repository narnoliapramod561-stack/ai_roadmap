import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Network,
  HelpCircle,
  Calendar,
  Repeat2,
  PenTool,
  MessageSquare,
  TrendingUp,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Study Planner', href: '/planner' },
  { icon: FolderOpen, label: 'My Materials', href: '/upload' },
  { icon: Network, label: 'Knowledge Map', href: '/map' },
  { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz' },
  { icon: Repeat2, label: 'Revision Queue', href: '/revision', badge: 'revisionQueue' },
  { icon: PenTool, label: 'Handwritten Grader', href: '/grader' },
  { icon: MessageSquare, label: 'AI Tutor', href: '/tutor' },
  { icon: TrendingUp, label: 'Progress', href: '/progress' },
  { icon: Settings2, label: 'More Settings', href: '/settings' },
]

export const Sidebar = () => {
  const location = useLocation()
  const studyStore = useStudyStore()
  const user = useUserStore(state => state.user)


  return (
    <aside className="w-72 glass-card h-[calc(100vh-8rem)] sticky top-28 ml-6 rounded-[32px] hidden md:flex flex-col border-white/5 shadow-2xl overflow-hidden mb-6">
      <div className="flex-1 py-10 px-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          
          let badgeCount = 0
          if (item.badge === 'revisionQueue') badgeCount = studyStore.revisionQueue.length
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group border border-transparent",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(0,245,212,0.1)]" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary text-glow-teal" : "text-white/20 group-hover:text-white")} />
                {item.label}
              </div>
              {badgeCount > 0 && (
                <Badge variant={isActive ? "secondary" : "default"} className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-black font-black text-[8px]">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
      <div className="p-6">
        <div className="rounded-[24px] glass p-6 border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
                <div className="text-[10px] font-black text-primary flex items-center gap-2 mb-2 tracking-widest uppercase">
                    <TrendingUp className="w-3 h-3" /> System Active
                </div>
                <h4 className="text-sm font-black uppercase tracking-tighter mb-1 text-white truncate">{user?.firstName || 'Scholar'}'s Path</h4>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-4 truncate">{user?.subject || 'Analyzing Core Concepts'}</p>
                <button className="w-full text-[10px] bg-primary text-black font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                    Start Streak
                </button>
            </div>
        </div>
      </div>
    </aside>
  )
}
