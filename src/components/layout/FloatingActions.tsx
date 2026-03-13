import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Zap, Target, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useFocusStore } from '@/stores/useFocusStore'
import { cn } from '@/lib/utils'

export const FloatingActions = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { toggleFocusMode, isFocusMode } = useFocusStore()

  const actions = [
    { 
      icon: MessageSquare, 
      label: 'Ask AI Tutor', 
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => { navigate('/tutor'); setIsOpen(false); }
    },
    { 
      icon: Zap, 
      label: 'Generate System', 
      color: 'bg-primary hover:bg-primary/90 text-black',
      onClick: () => { navigate('/upload'); setIsOpen(false); }
    },
    { 
      icon: Target, 
      label: isFocusMode ? 'Exit Focus' : 'Focus Mode', 
      color: isFocusMode ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600',
      onClick: () => { toggleFocusMode(); setIsOpen(false); }
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 items-end"
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <button 
                  onClick={action.onClick}
                  className="glass px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors border border-white/5"
                >
                  {action.label}
                </button>
                <Button
                  size="icon"
                  onClick={action.onClick}
                  className={cn(
                    "rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95",
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 transform",
          isOpen ? "bg-white/10 rotate-90" : "bg-primary shadow-primary/20",
          isFocusMode ? "ring-2 ring-primary ring-offset-2 ring-offset-[#07070A]" : ""
        )}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-black" />}
      </Button>
    </div>
  )
}
