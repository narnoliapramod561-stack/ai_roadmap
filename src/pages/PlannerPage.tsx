import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Clock, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Target,
  Trophy,
  Filter,
  Brain,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  AlertCircle
} from 'lucide-react'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export const PlannerPage = () => {
  const { user } = useUserStore()
  const { 
    tasks, 
    timeframe, 
    isLoading, 
    setTimeframe, 
    fetchTasks, 
    generateNewPlan, 
    toggleTask,
    toggleSubtopic,
    error,
    reset
  } = usePlannerStore()

  const { materials } = useStudyStore()
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id)
    }
  }, [user?.id, timeframe])

  const handleGenerateClick = () => {
    if (materials.length > 0) {
      setSelectedSubjects(materials.map(m => m.id)) // Default select all
      setShowSubjectModal(true)
    } else {
      executeGenerate([]) // If no materials, just run it (will trigger empty state)
    }
  }

  const executeGenerate = (materialIds: string[]) => {
    if (user?.id) {
      setShowSubjectModal(false)
      generateNewPlan(user.id, user.examDate, user.studyIntervals, materialIds)
    }
  }

  const containers = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const listItem = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
  }

  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const extractTime = (title: string) => {
    const timeMatch = title.match(/\[(.*?)\]/)
    if (timeMatch) {
      return {
        time: timeMatch[1],
        displayTitle: title.replace(timeMatch[0], '').trim()
      }
    }
    return { time: null, displayTitle: title }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Neural Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
            <Brain className="w-3 h-3" /> Neural Study Architect
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Focus <span className="text-primary text-glow-teal">Engine</span>
          </h1>
          <p className="text-white/40 text-sm font-medium">
            AI-optimized roadmap for <span className="text-white">{user?.subject || 'all subjects'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
            {['daily', 'weekly', 'monthly'].map((v) => (
              <button
                key={v}
                onClick={() => setTimeframe(v as any)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                  timeframe === v
                    ? "text-black mix-blend-normal"
                    : "text-white/40 hover:text-white"
                )}
              >
                {timeframe === v && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary shadow-lg shadow-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{v}</span>
              </button>
            ))}
          </div>
          <Button
            disabled={isLoading}
            onClick={handleGenerateClick}
            className="h-12 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-primary font-black uppercase tracking-widest rounded-2xl gap-2 active:scale-95 transition-all shadow-xl"
          >
            <Zap className={cn("w-4 h-4", isLoading && "animate-pulse")} />
            {tasks.length > 0 ? 'Sync Plan' : 'Forge Plan'}
          </Button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 relative">
             <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <div className="absolute inset-4 border-4 border-primary/10 border-b-primary rounded-full animate-spin-slow" />
             <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse mt-4">Synthesizing Neural Pathways...</span>
        </div>
      ) : tasks.length === 0 ? (
        <Card className="glass-card border-dashed border-white/10 p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 opacity-50" />
          <div className="relative z-10 w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20 rotate-3">
            <Target className="w-12 h-12 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-black uppercase tracking-tight text-white italic">Neural Buffer <span className="text-primary text-glow-teal">Empty</span></h3>
            <p className="text-white/40 text-sm max-w-sm mx-auto font-medium leading-relaxed">
              {materials.length === 0 
                ? "Your knowledge base is offline. Redirect to the 'Forging Station' to upload your first syllabus manifest." 
                : "No active roadmap found in neural cache. Initialize a new deconstruction to begin your progress."}
            </p>
          </div>
          <div className="relative z-10 flex justify-center gap-4">
             {materials.length === 0 ? (
               <Link to="/upload">
                 <Button className="bg-primary text-black font-black uppercase tracking-widest px-12 h-16 rounded-[24px] shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                   Go to Forging Station
                 </Button>
               </Link>
             ) : (
               <Button onClick={handleGenerateClick} className="bg-primary text-black font-black uppercase tracking-widest px-12 h-16 rounded-[24px] shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                 Initialize Neural Forge
               </Button>
             )}
          </div>
        </Card>
      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main List */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              variants={containers}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {tasks.map((task) => {
                const { time, displayTitle } = extractTime(task.title)
                const isExpanded = expandedTask === task.id

                return (
                  <motion.div variants={listItem} key={task.id}>
                    <Card
                      className={cn(
                        "glass group overflow-hidden border-white/5 hover:border-primary/30 transition-all shadow-2xl relative",
                        task.is_completed && "opacity-60 grayscale-[0.8]"
                      )}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                      <div className="flex flex-col">
                        <div className="flex items-center p-6 gap-6 relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleTask(task.id)
                            }}
                            className="shrink-0 transition-transform active:scale-95 z-20 relative cursor-pointer"
                          >
                            {task.is_completed ? (
                              <CheckCircle2 className="w-10 h-10 text-primary fill-primary/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-primary/40 flex items-center justify-center transition-all bg-white/5 shadow-inner">
                                <Circle className="w-4 h-4 text-transparent" />
                              </div>
                            )}
                          </button>

                          <div
                            className="flex-1 space-y-2 cursor-pointer"
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className={cn(
                                "text-xl font-black uppercase tracking-tighter text-white transition-all",
                                task.is_completed && "line-through text-white/40"
                              )}>
                                {displayTitle}
                              </h4>
                              <Badge className={cn(
                                "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                                task.priority === 'high' ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                                task.priority === 'medium' ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                              )}>
                                {task.priority} Priority
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                              {time && (
                                <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                  <Clock className="w-3 h-3" /> {time}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 italic">
                                <ListOrdered className="w-3 h-3" /> {task.category} mode
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                             <button
                              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-primary"
                             >
                               {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                             </button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-white/[0.02] border-t border-white/5"
                            >
                              <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Analytical Objective</p>
                                  <p className="text-sm text-white/70 leading-relaxed font-medium capitalize">{task.description}</p>
                                </div>

                                {task.subtopics && task.subtopics.length > 0 && (
                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Neural Sub-entities ({task.subtopics.length})</p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {task.subtopics.map((sub, i) => (
                                          <div 
                                            key={i} 
                                            onClick={() => toggleSubtopic(task.id, i)}
                                            className={cn(
                                              "flex items-center gap-4 p-4 glass border-white/5 rounded-2xl hover:border-primary/20 transition-all group/sub cursor-pointer",
                                              sub.is_completed && "opacity-50"
                                            )}
                                          >
                                             <button 
                                               type="button"
                                               onClick={(e) => {
                                                 e.preventDefault()
                                                 e.stopPropagation()
                                                 toggleSubtopic(task.id, i)
                                               }}
                                               className="shrink-0 transition-transform active:scale-95 z-20 relative cursor-pointer"
                                             >
                                               {sub.is_completed ? (
                                                 <CheckCircle2 className="w-7 h-7 text-primary fill-primary/10" />
                                               ) : (
                                                 <div className="w-7 h-7 rounded-full border-2 border-white/10 group-hover/sub:border-primary/40 flex items-center justify-center transition-all bg-white/5 shadow-inner">
                                                   <Circle className="w-3 h-3 text-transparent" />
                                                 </div>
                                               )}
                                             </button>
                                             <span className={cn(
                                               "text-[11px] font-bold tracking-tight transition-colors",
                                               sub.is_completed ? "text-white/40 line-through" : "text-white/70 group-hover/sub:text-white"
                                             )}>
                                               {sub.label}
                                             </span>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Stats / Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card p-8 border-white/5 space-y-8 sticky top-32 shadow-3xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Process Sync</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100)}% Verified
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(tasks.filter(t => t.is_completed).length / tasks.length) * 100}%` }}
                    className="h-full bg-primary shadow-[0_0_20px_rgba(0,245,212,0.6)] rounded-full" 
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-colors shadow-inner">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Items To Go</div>
                  <div className="text-3xl font-black text-white italic">{tasks.filter(t => !t.is_completed).length}</div>
                </div>
                <div className="glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-colors shadow-inner">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Time</div>
                  <div className="text-3xl font-black text-primary italic">
                    ~{Math.round(tasks.reduce((acc, t) => acc + (parseInt(t.duration) || 0), 0) / 60 * 10) / 10}h
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Today's Alpha Goal
                  </div>
                </div>
                
                <div className="glass p-6 rounded-[32px] border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                  <p className="relative z-10 text-[11px] text-white/80 uppercase leading-relaxed font-black tracking-tight italic">
                    Master the <span className="text-primary text-glow-teal">fundamental axioms</span> of your current module to unlock advanced neural analytics.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                 <Button 
                    variant="ghost" 
                    className="w-full h-16 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-primary/20 text-[10px] font-black uppercase tracking-[0.4em] gap-3 text-white/40 hover:text-primary transition-all group"
                 >
                    <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Filter Perspective
                 </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Subject Selection Modal */}
      <AnimatePresence>
        {showSubjectModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSubjectModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass border-white/10 p-8 rounded-[40px] shadow-3xl max-w-md w-full relative overflow-hidden space-y-8"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Select <span className="text-primary">Context</span></h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Choose subjects to include in this roadmap</p>
              </div>

              <div className="space-y-3 relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {materials.map(m => {
                  const isSelected = selectedSubjects.includes(m.id)
                  return (
                    <div 
                      key={m.id}
                      onClick={() => {
                        setSelectedSubjects(prev => 
                          isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                        )
                      }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                        isSelected ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected ? "border-primary bg-primary text-black" : "border-white/20 text-transparent group-hover:border-white/40"
                      )}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "font-bold uppercase tracking-wider text-xs truncate transition-colors",
                        isSelected ? "text-primary" : "text-white/70"
                      )}>{m.subject_name || m.filename}</span>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-4 relative z-10">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSubjectModal(false)}
                  className="flex-1 h-12 uppercase font-black text-[10px] tracking-widest hover:bg-white/10 rounded-2xl"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => executeGenerate(selectedSubjects)}
                  disabled={selectedSubjects.length === 0}
                  className="flex-1 h-12 bg-primary text-black uppercase font-black text-[10px] tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all border-none"
                >
                  Initialize
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
