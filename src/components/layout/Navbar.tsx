import { Link, useNavigate } from 'react-router-dom'
import { BrainCircuit, Github, Sun, Moon, LogOut } from 'lucide-react'
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
    <nav className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <BrainCircuit className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">SmartScholar AI</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
        <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        {user && <Link to="/map" className="hover:text-foreground transition-colors">My Roadmap</Link>}
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 hover:bg-muted rounded-md transition-colors hidden sm:block">
          <Github className="w-5 h-5" />
        </a>
        
        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold leading-none">{user.firstName}</span>
              <span className="text-[10px] text-muted-foreground">{user.className}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button size="sm">Get Started</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}

