import { useEffect, useState } from 'react'
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
  ListOrdered
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
  const containerRef = useRef(null);

  const { user } = useUserStore()
  const { 
    tasks, 
    timeframe, 
    isLoading, 
    setTimeframe, 
    fetchTasks, 
    generateNewPlan, 
    toggleTask,
    toggleSubtopic
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
    <div className="max-w-5xl mx-auto space-y-12 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-4">
           NEURAL <span className="text-primary drop-shadow-[0_0_20px_#00F5D480]">ROADMAP</span>
           <div className="px-3 py-1 rounded bg-[#B9A7FF]/20 border border-[#B9A7FF]/50 text-[#B9A7FF] text-[10px] font-mono animate-pulse uppercase">
              {todayTopics.length} Nodes Active
           </div>
        </h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] mt-2">
          Your synthesized high-frequency study sequence
        </p>
      </motion.div>

      {/* Progress HUD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="refracted-glass border-highlight rounded-[30px] p-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group"
      >
         <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-[#B9A7FF] shadow-[0_0_20px_#00F5D4]" />
         
         <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end">
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Session Progress</h3>
                  <div className="text-4xl font-black italic tracking-tighter text-white">
                     {Math.round(completionRate)}<span className="text-xl text-white/50">%</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Time Remaining</div>
                  <div className="text-lg font-black tracking-widest text-[#B9A7FF] font-mono">
                     {Math.round(totalMinutesLeft)} MIN
                  </div>
               </div>
            </div>
            
            <div className="h-3 w-full bg-[#07070A] rounded-full overflow-hidden border border-white/10 relative">
               <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite]" />
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-[#B9A7FF] relative"
               >
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-white/50 blur-sm" />
               </motion.div>
            </div>
         </div>
      </motion.div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
           <Cpu className="w-12 h-12 text-primary animate-pulse shadow-[0_0_15px_#00F5D4]" />
           <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary animate-pulse">Syncing Nodes...</div>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold text-center">
          {error}
        </div>
      ) : Object.keys(groupedTopics).length === 0 ? (
        <div className="text-center py-32 refracted-glass border-highlight rounded-[30px]">
          <Target className="mx-auto h-16 w-16 text-white/20 mb-6" />
          <h3 className="mt-2 text-2xl font-black uppercase tracking-widest text-white italic">No active nodes</h3>
          <p className="mt-1 text-white/40 font-bold uppercase tracking-widest text-xs">Run data ingestion to synthesize your map.</p>
        </div>
      ) : (
        <div className="space-y-24 mt-16" ref={containerRef}>
          {Object.entries(groupedTopics).map(([subject, topics], subjectIndex) => (
            <motion.div 
               key={subject}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
               viewport={{ once: true, margin: "-100px" }}
               className="relative"
            >
              {/* Subject Header */}
              <div className="flex items-center gap-6 mb-12 sticky top-24 z-20 bg-[#07070A]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-6 h-6 text-[#B9A7FF]" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                      {subject}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B9A7FF]">Module Sequence</p>
                 </div>
              </div>
              
              <div className="space-y-8 pl-6 md:pl-20 relative">
                 {/* Timeline Line */}
                 <div className="absolute left-[38px] md:left-[94px] top-0 bottom-0 w-px bg-gradient-to-b from-primary via-white/10 to-transparent" />

                {topics.map((topic, index) => (
                  <TimelineCard 
                     key={topic.id} 
                     topic={topic} 
                     index={index} 
                     isAllComplete={topic.status === 'completed'}
                     toggleTopicStatus={toggleTopicStatus}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .refracted-glass {
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(25px) saturate(160%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        }
        .border-highlight {
          border: 1px solid transparent;
          background: linear-gradient(#07070A, #07070A) padding-box,
                      linear-gradient(135deg, rgba(0, 245, 212, 0.5) 0%, transparent 40%) border-box;
        }
        @keyframes shimmer {
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
};

// 3D Parallax Timeline Card Component
const TimelineCard = ({ topic, index, isAllComplete, toggleTopicStatus }: { topic: any, index: number, isAllComplete: boolean, toggleTopicStatus: any }) => {
   const cardRef = useRef(null)
   const { scrollYProgress } = useScroll({
      target: cardRef,
      offset: ["0 1.2", "1.2 0"]
   })

   // 3D Parallax Roll Transform
   const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -30])
   const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])
   const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

   // Mouse Tilt Interaction
   const mouseX = useMotionValue(0)
   const mouseY = useMotionValue(0)

   const hoverRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 40, stiffness: 300 })
   const hoverRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { damping: 40, stiffness: 300 })

   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
     const rect = e.currentTarget.getBoundingClientRect()
     const xPct = (e.clientX - rect.left) / rect.width - 0.5
     const yPct = (e.clientY - rect.top) / rect.height - 0.5
     mouseX.set(xPct)
     mouseY.set(yPct)
   }

   const handleMouseLeave = () => {
     mouseX.set(0)
     mouseY.set(0)
   }

   const getPriorityColor = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'high': return 'text-primary bg-primary/10 border-primary/30';
        case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
        case 'low': return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
        default: return 'text-white/40 bg-white/5 border-white/10';
      }
    };

   return (
      <motion.div 
         ref={cardRef}
         style={{ opacity, scale, rotateX: rotateX as any, perspective: '1000px', transformOrigin: 'top center' }}
         className="relative group py-4"
      >
         {/* Node indicator */}
         <div className="absolute left-[-26px] top-1/2 -translate-y-1/2 z-10">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all bg-[#07070A] ${isAllComplete ? 'border-primary shadow-[0_0_15px_#00F5D4]' : 'border-white/20'}`}>
               <div className={`w-2 h-2 rounded-sm ${isAllComplete ? 'bg-primary' : 'bg-white/20 group-hover:bg-primary/50'}`} />
            </div>
         </div>

         <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX: hoverRotateX as any, rotateY: hoverRotateY as any, transformStyle: "preserve-3d" }}
            className={`refracted-glass rounded-[30px] p-6 md:p-8 transition-all relative overflow-hidden ${
               isAllComplete ? 'border border-primary' : 'border-highlight group-hover:border-primary/50'
             }`}
         >
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10" style={{ transform: "translateZ(30px)" }}>
                 <div className="space-y-4 flex-1">
                     <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border flex items-center gap-1.5 ${getPriorityColor(topic.priority)}`}>
                           <Zap className="w-3 h-3" /> {topic.priority} Priority
                        </span>
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/10 bg-white/5 text-white/60 flex items-center gap-1.5">
                           <Clock className="w-3 h-3" /> {topic.time_estimate_minutes} MIN
                        </span>
                     </div>
                     <h3 className={`text-2xl font-black italic tracking-tighter uppercase transition-colors ${
                       isAllComplete ? 'text-white/40 line-through' : 'text-white'
                     }`}>
                       {topic.title}
                     </h3>
                     {topic.description && (
                       <p className={`text-sm font-bold tracking-widest uppercase transition-colors line-clamp-2 ${
                         isAllComplete ? 'text-white/20' : 'text-white/50'
                       }`}>
                         {topic.description}
                       </p>
                     )}
                 </div>

                 <div className="flex items-center gap-4 shrink-0" style={{ transform: "translateZ(40px)" }}>
                     <button
                       onClick={() => toggleTopicStatus(topic.id, topic.status)}
                       className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
                         isAllComplete
                           ? 'bg-primary border-primary text-black shadow-[0_0_30px_#00F5D4]'
                           : 'bg-transparent border-white/20 text-white hover:border-primary hover:text-primary'
                       }`}
                     >
                       {isAllComplete ? <CheckCircle className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                     </button>
                 </div>
             </div>
         </motion.div>
      </motion.div>
   )
}
