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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudyStore } from '@/stores/useStudyStore'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderOpen, label: 'My Materials', href: '/upload' },
  { icon: Network, label: 'Knowledge Map', href: '/map' },
  { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz' },
  { icon: Calendar, label: 'Study Planner', href: '/planner' },
  { icon: Repeat2, label: 'Revision Queue', href: '/revision', badge: 'revisionQueue' },
  { icon: PenTool, label: 'Handwritten Grader', href: '/grader' },
  { icon: MessageSquare, label: 'AI Tutor', href: '/tutor' },
  { icon: TrendingUp, label: 'Progress', href: '/progress' },
]

export const Sidebar = () => {
  const location = useLocation()
  const studyStore = useStudyStore()

  return (
    <aside className="w-64 border-r bg-muted/20 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col">
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          
          let badgeCount = 0
          if (item.badge === 'revisionQueue') badgeCount = studyStore.revisionQueue.length
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
              {badgeCount > 0 && (
                <Badge variant={isActive ? "secondary" : "default"} className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t">
        <div className="rounded-xl bg-orange-500/10 p-4 border border-orange-500/20">
          <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Focus Mode</div>
          <p className="text-xs text-muted-foreground mb-3">Distraction-free learning</p>
          <button className="w-full text-xs bg-orange-500 text-white font-medium py-1.5 rounded shadow-sm hover:bg-orange-600 transition">
            Start Session
          </button>
        </div>
      </div>
    </aside>
  )
}
