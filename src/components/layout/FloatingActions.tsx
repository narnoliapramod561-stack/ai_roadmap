import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Zap, Target, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FloatingActions = () => {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: MessageSquare, label: 'Ask AI Tutor', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: Zap, label: 'Generate System', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: Target, label: 'Focus Mode', color: 'bg-orange-500 hover:bg-orange-600' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
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
                <span className="bg-background border shadow-sm px-3 py-1.5 rounded-md text-sm font-medium">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  className={`rounded-full shadow-lg ${action.color} text-white`}
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
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
      >
        {isOpen ? <X className="w-6 h-6 text-primary-foreground" /> : <Plus className="w-6 h-6 text-primary-foreground" />}
      </Button>
    </div>
  )
}
