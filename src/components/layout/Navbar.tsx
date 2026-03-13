import { Link } from 'react-router-dom'
import { BrainCircuit, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Navbar = () => {
  return (
    <nav className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">SmartScholar AI</span>
      </div>
      
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
        <Link to="/#demo" className="hover:text-foreground transition-colors">Demo</Link>
        <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
      </div>
      
      <div className="flex items-center gap-4">
        <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 hover:bg-muted rounded-md transition-colors">
          <Github className="w-5 h-5" />
        </a>
        <Button variant="outline" className="hidden sm:flex">Login</Button>
      </div>
    </nav>
  )
}
