import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Sun, Moon, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/useUserStore'

export const Navbar = () => {
  const [isDark, setIsDark] = useState(false)
  const user = useUserStore(state => state.user)
  const logout = useUserStore(state => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleDark = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="h-20 glass sticky top-0 z-[100] flex items-center justify-between px-8 border-b-white/5 mx-6 mt-4 rounded-2xl shadow-2xl">
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.4)] transition-transform group-hover:rotate-12">
            <Sparkles className="w-5 h-5 text-black" />
        </div>
        <span className="font-black text-xl tracking-tighter text-glow-teal uppercase">SmartScholar AI</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest opacity-80">
        <Link to="/" className="hover:text-primary transition-colors">Features</Link>
        <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        {user && <Link to="/map" className="hover:text-primary transition-colors">Knowledge Map</Link>}
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full hover:bg-white/5">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        
        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l border-white/5">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{user.firstName}</span>
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{user.className}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/40 hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="bg-primary text-black font-black uppercase tracking-tighter px-6 rounded-xl hover:bg-white transition-all">Start Scanning</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}

