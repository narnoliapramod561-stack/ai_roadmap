import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  Target,
  Trophy,
  Brain,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  AlertCircle,
  CalendarDays,
  BookOpenCheck,
  Layers,
  Flame,
  RotateCcw,
  BookMarked,
  X,
  ChevronRight
} from 'lucide-react'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  try {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    return diff
  } catch {
    return null
  }
}

function urgencyColor(days: number | null) {
  if (days === null) return 'text-white/40'
  if (days <= 7) return 'text-red-400'
  if (days <= 21) return 'text-orange-400'
  return 'text-primary'
}

// ─── Component ───────────────────────────────────────────────────────────────
export const PlannerPage = () => {
  const { user } = useUserStore()
  const {
    tasks,
    timeframe,
    isLoading,
    learnedTopics,
    setTimeframe,
    fetchTasks,
    generateNewPlan,
    toggleTask,
    toggleSubtopic,
    markTopicLearned,
    unlearnTopic,
    fetchLearnedTopics,
    error
  } = usePlannerStore()

  const { materials } = useStudyStore()

  // Modal state
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [restartMode, setRestartMode] = useState(false)

  // UI state
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [markingLearned, setMarkingLearned] = useState<string | null>(null)
  const [justMarked, setJustMarked] = useState<string | null>(null)
  const [selectedFilterSubject, setSelectedFilterSubject] = useState<string>('all')

  // Computed exam countdown
  const daysUntilExam = getDaysUntil(user?.examDate)

  // Nearest material exam date across selected/all materials
  const nearestMaterialExam = useMemo(() => {
    if (!materials.length) return null
    const dates = materials
      .map(m => ({ label: m.subject_name || m.subject || m.file_name || m.filename || 'Syllabus', date: m.exam_date }))
      .filter(x => !!x.date)
      .map(x => ({ ...x, days: getDaysUntil(x.date) }))
      .filter(x => x.days !== null && x.days >= 0)
      .sort((a, b) => (a.days as number) - (b.days as number))
    return dates[0] ?? null
  }, [materials])

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id)
      fetchLearnedTopics(user.id)
    }
  }, [user?.id, timeframe])

  const handleGenerateClick = () => {
    if (materials.length > 0) {
      setSelectedSubjects(materials.map(m => m.id))
      setShowSubjectModal(true)
    } else {
      executeGenerate([])
    }
  }

  const executeGenerate = (materialIds: string[]) => {
    if (user?.id) {
      setShowSubjectModal(false)
      const effectiveExamDate = nearestMaterialExam?.date || user.examDate
      generateNewPlan(user.id, effectiveExamDate, user.studyIntervals, materialIds)
    }
  }

  const handleMarkLearned = async (task: any) => {
    if (!user?.id) return
    setMarkingLearned(task.id)
    await markTopicLearned(user.id, task.title)
    // Also mark as complete in the plan
    if (!task.is_completed) await toggleTask(task.id)
    setMarkingLearned(null)
    setJustMarked(task.id)
    setTimeout(() => setJustMarked(null), 2500)
  }

  const handleUnlearnTopic = async (topicLabel: string) => {
    if (!user?.id) return
    await unlearnTopic(user.id, topicLabel)
  }

  const isTopicLearned = (title: string) =>
    learnedTopics.some(t => t.topic_label === title)

  // Animation variants
  const containers: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
  }
  const listItem: Variants = {
    hidden: { x: -24, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 22 } }
  }

  const extractTime = (title: string) => {
    const timeMatch = title.match(/\[(.*?)\]/)
    if (timeMatch) {
      return { time: timeMatch[1], displayTitle: title.replace(timeMatch[0], '').trim() }
    }
    return { time: null, displayTitle: title }
  }

  // Filter tasks based on selected subject
  const filteredTasks = useMemo(() => {
    if (selectedFilterSubject === 'all') return tasks
    const subject = materials.find(m => m.id === selectedFilterSubject)
    if (!subject) return tasks

    // Filter logic: match task descriptions or subtopics against the material subject or filename
    const subjectKeywords = [subject.subject_name, subject.subject, subject.filename, subject.file_name].filter(Boolean).map(k => k.toLowerCase())
    
    // As a strict fallback without detailed tracking, we check if the task title or description mentions the subject
    return tasks.filter(t => {
       const text = `${t.title} ${t.description}`.toLowerCase()
       return subjectKeywords.some(k => text.includes(k))
    })
  }, [tasks, selectedFilterSubject, materials])

  const completedCount = filteredTasks.filter(t => t.is_completed).length
  const progress = filteredTasks.length ? (completedCount / filteredTasks.length) * 100 : 0
  const totalMinutes = filteredTasks.reduce((acc, t) => acc + (parseInt(t.duration) || 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">

      {/* ── Neural Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
            <Brain className="w-3 h-3" /> Neural Study Architect
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Focus <span className="text-primary text-glow-teal">Engine</span>
          </h1>
          <p className="text-white/40 text-sm font-medium">
            AI-optimized roadmap for <span className="text-white">{materials.length ? `${materials.length} subject${materials.length > 1 ? 's' : ''}` : 'all subjects'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Toggle */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTimeframe(v)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                  timeframe === v ? "text-black mix-blend-normal" : "text-white/40 hover:text-white"
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

            {/* Subject Filter Dropdown */}
            {materials.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors bg-white/5 border-l border-white/10 ml-1">
                  {selectedFilterSubject === 'all' ? 'All Subjects' : materials.find(m => m.id === selectedFilterSubject)?.subject_name || materials.find(m => m.id === selectedFilterSubject)?.file_name || 'Subject'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full mt-2 right-0 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 w-48 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all scale-95 group-hover:scale-100 origin-top-right">
                   <button 
                     onClick={() => setSelectedFilterSubject('all')}
                     className={cn("w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors", selectedFilterSubject === 'all' ? "text-primary bg-primary/10" : "text-white/60")}
                   >
                     All Subjects
                   </button>
                   {materials.map(m => (
                     <button
                       key={m.id}
                       onClick={() => setSelectedFilterSubject(m.id)}
                       className={cn("w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors truncate", selectedFilterSubject === m.id ? "text-primary bg-primary/10" : "text-white/60")}
                     >
                       {m.subject_name || m.subject || m.file_name || 'Untitled'}
                     </button>
                   ))}
                </div>
              </div>
            )}
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

      {/* ── Exam Countdown Banners ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Primary exam date from user profile */}
        {user?.examDate && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-bold",
              daysUntilExam !== null && daysUntilExam <= 7
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : daysUntilExam !== null && daysUntilExam <= 21
                  ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                  : "bg-primary/10 border-primary/20 text-primary"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            <span>
              {daysUntilExam !== null && daysUntilExam >= 0
                ? (<><span className="text-2xl font-black">{daysUntilExam}</span> <span className="text-[11px] uppercase tracking-widest font-black opacity-70">days to exam</span></>)
                : <span className="text-[11px] uppercase tracking-widest font-black">Exam passed</span>
              }
            </span>
            {daysUntilExam !== null && daysUntilExam <= 7 && <Flame className="w-4 h-4" />}
          </motion.div>
        )}

        {/* Per-material nearest exam date (if different from user profileOne) */}
        {nearestMaterialExam && nearestMaterialExam.date !== user?.examDate && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border bg-white/5 border-white/10 text-white/60 text-sm font-bold"
          >
            <BookMarked className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-widest">Nearest: <span className="text-white">{nearestMaterialExam.label}</span> in <span className={urgencyColor(nearestMaterialExam.days)}>{nearestMaterialExam.days}d</span></span>
          </motion.div>
        )}

        {/* Learned topics badge */}
        {learnedTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-sm font-bold"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-widest font-black">
              <span className="text-2xl font-black text-emerald-300">{learnedTopics.length}</span> topics learned
            </span>
          </motion.div>
        )}

        {/* No exam date nudge */}
        {!user?.examDate && materials.length > 0 && !nearestMaterialExam && (
          <Link to="/settings">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-dashed border-white/10 text-white/30 text-[11px] font-bold uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" /> Set exam date for smart pacing
            </motion.div>
          </Link>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* ── Loading ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-primary/10 border-b-primary rounded-full animate-spin-slow" />
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse mt-4">
            Synthesizing Neural Pathways...
          </span>
          {nearestMaterialExam && (
            <span className="text-[10px] text-white/30 font-bold">Optimizing for exam in {nearestMaterialExam.days} days</span>
          )}
        </div>

      ) : tasks.length === 0 ? (
        /* ── Empty State ─────────────────────────────────── */
        <Card className="glass-card border-dashed border-white/10 p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 opacity-50" />
          <div className="relative z-10 w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20 rotate-3">
            <Target className="w-12 h-12 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-black uppercase tracking-tight text-white italic">
              Neural Buffer <span className="text-primary text-glow-teal">Empty</span>
            </h3>
            <p className="text-white/40 text-sm max-w-sm mx-auto font-medium leading-relaxed">
              {materials.length === 0
                ? "Your knowledge base is offline. Go to the 'Forging Station' to upload your first syllabus."
                : "No active roadmap found. Click 'Forge Plan' to generate a personalized study plan from your syllabi."}
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
        /* ── Main Content ────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Task List */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div variants={containers} initial="hidden" animate="show" className="space-y-4">
              {filteredTasks.length === 0 && selectedFilterSubject !== 'all' ? (
                 <div className="p-10 text-center border border-dashed border-white/10 rounded-[24px] bg-white/5">
                    <Target className="w-8 h-8 text-white/20 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">No tasks matched for this subject in the current plan.</p>
                 </div>
              ) : filteredTasks.map((task) => {
                const { time, displayTitle } = extractTime(task.title)
                const isExpanded = expandedTask === task.id
                const learned = isTopicLearned(task.title)

                return (
                  <motion.div variants={listItem} key={task.id}>
                    <Card className={cn(
                      "glass group overflow-hidden border-white/5 hover:border-primary/30 transition-all shadow-2xl relative",
                      task.is_completed && "opacity-60 grayscale-[0.8]",
                      learned && "border-emerald-500/20 hover:border-emerald-500/40"
                    )}>
                      <div className={cn(
                        "absolute inset-y-0 left-0 w-1 scale-y-0 group-hover:scale-y-100 transition-transform origin-top",
                        learned ? "bg-emerald-500" : "bg-primary"
                      )} />

                      <div className="flex flex-col">
                        {/* Main row */}
                        <div className="flex items-center p-6 gap-6 relative">
                          {/* Complete checkbox */}
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTask(task.id) }}
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

                          {/* Info */}
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
                              {learned && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                  ✓ Learned
                                </span>
                              )}
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
                              {task.duration && !time && (
                                <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                  <Clock className="w-3 h-3" /> {task.duration}m
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 italic">
                                <ListOrdered className="w-3 h-3" /> {task.category} mode
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-primary"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Expanded content */}
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

                                {/* Subtopics */}
                                {task.subtopics && task.subtopics.length > 0 && (
                                  <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                                      Neural Sub-entities ({task.subtopics.length})
                                    </p>
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
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSubtopic(task.id, i) }}
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

                                {/* Mark as Learned button */}
                                <div className="pt-2 border-t border-white/5 flex gap-3 flex-wrap">
                                  {learned ? (
                                    <button
                                      onClick={() => handleUnlearnTopic(task.title)}
                                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Mark as Unlearned
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkLearned(task)}
                                      disabled={markingLearned === task.id}
                                      className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95",
                                        markingLearned === task.id && "opacity-50 cursor-wait",
                                        justMarked === task.id && "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                      )}
                                    >
                                      {justMarked === task.id
                                        ? <><CheckCircle2 className="w-3 h-3" /> Saved to Progress!</>
                                        : <><BookOpenCheck className="w-3 h-3" /> Mark as Learned</>
                                      }
                                    </button>
                                  )}
                                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-wider self-center">
                                    Saved topics are excluded from future plans
                                  </span>
                                </div>
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

          {/* ── Sidebar ─────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card p-8 border-white/5 space-y-8 sticky top-32 shadow-3xl">

              {/* Progress bar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Session Sync</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {Math.round(progress)}% Done
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary shadow-[0_0_20px_rgba(0,245,212,0.6)] rounded-full"
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                </div>
              </div>

              {/* Stats grid */}
               <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-colors shadow-inner">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">To Go</div>
                  <div className="text-3xl font-black text-white italic">{filteredTasks.filter(t => !t.is_completed).length}</div>
                </div>
                <div className="glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-colors shadow-inner">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Time</div>
                  <div className="text-3xl font-black text-primary italic">
                    ~{Math.round(totalMinutes / 60 * 10) / 10}h
                  </div>
                </div>
              </div>

              {/* Exam countdown in sidebar */}
              {(daysUntilExam !== null || nearestMaterialExam) && (
                <div className={cn(
                  "p-5 rounded-2xl border text-center",
                  daysUntilExam !== null && daysUntilExam <= 7
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-primary/5 border-primary/10"
                )}>
                  <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Exam Countdown</div>
                  <div className={cn("text-4xl font-black", urgencyColor(daysUntilExam ?? nearestMaterialExam?.days ?? null))}>
                    {daysUntilExam ?? nearestMaterialExam?.days}
                  </div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">days remaining</div>
                  {daysUntilExam !== null && daysUntilExam <= 7 && (
                    <div className="text-[10px] text-red-400 font-black uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3" /> Final stretch!
                    </div>
                  )}
                </div>
              )}

              {/* Learned topics section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 italic flex items-center gap-2">
                    <BookOpenCheck className="w-4 h-4" /> Learned Topics
                  </div>
                  <span className="text-[10px] font-black text-white/20">{learnedTopics.length} total</span>
                </div>

                {learnedTopics.length === 0 ? (
                  <p className="text-[10px] text-white/20 font-bold italic">No topics marked as learned yet. Expand a task and click "Mark as Learned".</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {learnedTopics.slice(0, 8).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 group/lt">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[10px] text-white/50 font-bold truncate flex-1">{t.topic_label}</span>
                        <button
                          onClick={() => handleUnlearnTopic(t.topic_label)}
                          className="opacity-0 group-hover/lt:opacity-100 p-1 hover:text-red-400 text-white/20 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {learnedTopics.length > 8 && (
                      <p className="text-[10px] text-white/20 font-bold italic">+{learnedTopics.length - 8} more</p>
                    )}
                  </div>
                )}
              </div>

              {/* Today's goal */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Today's Alpha Goal
                  </div>
                </div>
                <div className="glass p-5 rounded-[28px] border-white/5 relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                  <p className="relative z-10 text-[11px] text-white/80 uppercase leading-relaxed font-black tracking-tight italic">
                    {filteredTasks.find(t => !t.is_completed)
                      ? <>Master <span className="text-primary text-glow-teal">{extractTime(filteredTasks.find(t => !t.is_completed)!.title).displayTitle.substring(0, 30)}</span> to advance your progress</>
                      : <span className="text-emerald-400">🎉 All tasks complete! Forge a new plan.</span>
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Subject Selection Modal ────────────────────────────────── */}
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
              className="glass border-white/10 p-8 rounded-[40px] shadow-3xl w-full max-w-lg relative overflow-hidden space-y-6"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />

              <div className="space-y-1 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                  Select <span className="text-primary">Syllabus</span>
                </h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                  Choose subjects for this roadmap — exam dates shown below
                </p>
              </div>

              {/* Restart vs Continue toggle */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 relative z-10">
                <button
                  onClick={() => setRestartMode(false)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                    !restartMode ? "text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  {!restartMode && <motion.div layoutId="modeTab" className="absolute inset-0 bg-primary" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                  <span className="relative z-10 flex items-center justify-center gap-1"><ChevronRight className="w-3 h-3" /> Continue</span>
                </button>
                <button
                  onClick={() => setRestartMode(true)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                    restartMode ? "text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  {restartMode && <motion.div layoutId="modeTab" className="absolute inset-0 bg-orange-500" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                  <span className="relative z-10 flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3" /> Restart</span>
                </button>
              </div>
              {restartMode && (
                <p className="text-[10px] text-orange-400 font-bold -mt-2 relative z-10">⚠ Restart will ignore learned topics and start from the beginning of the syllabus.</p>
              )}

              {/* Subject cards */}
              <div className="space-y-3 relative z-10 max-h-[40vh] overflow-y-auto pr-2">
                {materials.map(m => {
                  const isSelected = selectedSubjects.includes(m.id)
                  const subjectExamDate = m.exam_date
                  const subjectDays = getDaysUntil(subjectExamDate)
                  const subjectLabel = m.subject_name || m.subject || m.filename || m.file_name || 'Untitled'
                  const totalTopics = (m.ai_roadmap?.topics?.length || m.ai_roadmap?.knowledge_graph?.nodes?.length || 0)
                  const learnedFromThis = learnedTopics.filter(t => t.material_id === m.id).length

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedSubjects(prev =>
                        isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                      )}
                      className={cn(
                        "flex flex-col gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                        isSelected ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          isSelected ? "border-primary bg-primary text-black" : "border-white/20"
                        )}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className={cn(
                          "font-bold uppercase tracking-wider text-xs truncate flex-1",
                          isSelected ? "text-primary" : "text-white/70"
                        )}>
                          {subjectLabel}
                        </span>
                        {subjectDays !== null && (
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0",
                            subjectDays <= 7 ? "text-red-400 border-red-500/20 bg-red-500/10" :
                              subjectDays <= 21 ? "text-orange-400 border-orange-500/20 bg-orange-500/10" :
                                "text-primary border-primary/20 bg-primary/10"
                          )}>
                            {subjectDays}d
                          </span>
                        )}
                      </div>

                      {/* Per-subject progress bar */}
                      {totalTopics > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase tracking-widest">
                            <span>{learnedFromThis} / {totalTopics} learned</span>
                            <span>{Math.round((learnedFromThis / totalTopics) * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.round((learnedFromThis / totalTopics) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {subjectExamDate && (
                        <div className="flex items-center gap-1 text-[9px] text-white/30 font-bold">
                          <CalendarDays className="w-3 h-3" /> Exam: {subjectExamDate}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 relative z-10">
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
                  <Layers className="w-4 h-4 mr-1" />
                  Initialize {selectedSubjects.length > 1 ? `${selectedSubjects.length} Subjects` : 'Plan'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
