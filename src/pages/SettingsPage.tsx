import { useState } from 'react'
import { 
  Settings2, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Info,
  Brain,
  Timer,
  Calendar
} from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import type { StudyInterval } from '@/stores/useUserStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export const SettingsPage = () => {
  const { user, updateIntervals } = useUserStore()
  const [intervals, setIntervals] = useState<StudyInterval[]>(user?.studyIntervals || [])
  const [isSaved, setIsSaved] = useState(false)

  const addInterval = () => {
    const newInterval: StudyInterval = {
      id: crypto.randomUUID(),
      start: '09:00',
      end: '11:00'
    }
    setIntervals([...intervals, newInterval])
    setIsSaved(false)
  }

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id))
    setIsSaved(false)
  }

  const updateInterval = (id: string, field: 'start' | 'end', value: string) => {
    setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: value } : i))
    setIsSaved(false)
  }

  const handleSave = () => {
    updateIntervals(intervals)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
            <Settings2 className="w-3 h-3" /> Cognitive Configuration
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Study <span className="text-primary text-glow-teal">Settings</span>
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Configure your study windows for <span className="text-white text-glow-teal">AI Precision</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: List */}
        <div className="lg:col-span-8 space-y-8">
          {/* Exam Date Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[40px] border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white italic">Target Exam Date</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">The deadline for your cognitive objective</p>
              </div>
            </div>

            <div className="max-w-xs">
              <input 
                type="date" 
                value={user?.examDate || ''}
                onChange={(e) => {
                  useUserStore.getState().setExamDate(e.target.value)
                  setIsSaved(false)
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/40 transition-all font-black uppercase tracking-widest text-xs"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-8 rounded-[40px] border-white/5 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white italic">Study Intervals</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Define your active learning blocks</p>
                </div>
              </div>
              <Button 
                onClick={addInterval}
                className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] rounded-xl px-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Block
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {intervals.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center glass border-dashed border-white/5 rounded-3xl"
                  >
                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No intervals defined. AI will use generic scheduling.</p>
                  </motion.div>
                ) : (
                  intervals.map((interval, index) => (
                    <motion.div
                      key={interval.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      className="group flex items-center gap-6 p-6 glass rounded-2xl border-white/5 hover:border-white/10 transition-all border border-transparent"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 group-hover:text-primary transition-colors border border-white/5">
                        0{index + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">Start Time</label>
                          <input 
                            type="time" 
                            value={interval.start}
                            onChange={(e) => updateInterval(interval.id, 'start', e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">End Time</label>
                          <input 
                            type="time" 
                            value={interval.end}
                            onChange={(e) => updateInterval(interval.id, 'end', e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all font-bold"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => removeInterval(interval.id)}
                        className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaved}
                className={cn(
                  "h-14 px-10 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl",
                  isSaved ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-black shadow-primary/20"
                )}
              >
                {isSaved ? "Configuration Linked" : "Forge Settings"}
                <Save className="ml-3 w-5 h-5 text-black/50" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card p-8 border-white/5 space-y-8 sticky top-32">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Neural Impact</h3>
              </div>
              
              <div className="glass p-6 rounded-[24px] border-white/5 relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/20" />
                <p className="text-[11px] text-white/40 leading-relaxed font-bold uppercase tracking-widest">
                  By defining specific study windows, you enable the <span className="text-white italic">Focus Engine</span> to architect tasks that fit your peak cognitive energy periods.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Timer className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Interval Precision</p>
                    <p className="text-[9px] text-white/20 font-bold leading-relaxed uppercase">Studies show that consistent intervals improve neural retention by 40%.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">AI Sync</p>
                    <p className="text-[9px] text-white/20 font-bold leading-relaxed uppercase">Any changes here will automatically refine your next daily roadmap forge.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] text-center italic">
                Cognitive OS Layer 1.0.4
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
