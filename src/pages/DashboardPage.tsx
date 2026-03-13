import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Target, TrendingUp, Activity, Clock, Medal,
  Brain, Sparkles, AlertTriangle, BookOpen, ChevronRight as ChevronRightIcon,
  Trophy, BarChart2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'

export const DashboardPage = () => {
  const user = useUserStore(state => state.user)
  const { materials } = useStudyStore()

  const [readiness, setReadiness] = useState<any>(null)
  const [overdueTopics, setOverdueTopics] = useState<any[]>([])
  const [quizHistory, setQuizHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Live fetch on mount
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setIsLoading(true)
      try {
        const [readinessData, overdueData, historyData] = await Promise.all([
          api.getReadinessScore(user.id!).catch(() => null),
          api.getOverdueTopics(user.id!).catch(() => ({ overdue: [] })),
          api.getQuizHistory(user.id!).catch(() => []),
        ])
        setReadiness(readinessData)
        setOverdueTopics(overdueData?.overdue || [])
        setQuizHistory(historyData || [])
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.id])

  const readinessPct = readiness?.readiness_pct ?? 0
  const weakAreas = readiness?.weak_areas ?? []
  const strongAreas = readiness?.strong_areas ?? []
  const recentQuizzes = quizHistory.slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            NEURAL <span className="text-primary drop-shadow-[0_0_20px_#00F5D480]">OVERVIEW</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] mt-2">
            Welcome back, Agent {user?.firstName || 'Unknown'}
          </p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 backdrop-blur-md">
          <button className="px-6 py-2 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(0,245,212,0.3)]">Analytics</button>
          <button className="px-6 py-2 rounded-xl text-white/50 hover:text-white font-black uppercase tracking-widest text-xs transition-colors">History</button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Activity} title="Exam Readiness" value={`${Math.round(readinessPct)}%`}
          trend={readinessPct >= 80 ? 'Excellent' : readinessPct >= 50 ? 'Progressing' : 'Needs Work'}
          color={readinessPct >= 80 ? 'text-primary' : readinessPct >= 50 ? 'text-yellow-400' : 'text-red-400'} delay={0.1}
        />
        <StatCard icon={Target} title="Topics Mastered" value={String(strongAreas.length)}
          trend={`${readiness?.topics_attempted ?? 0} attempted`} color="text-[#B9A7FF]" delay={0.2}
        />
        <StatCard icon={Clock} title="Overdue Reviews" value={String(overdueTopics.length)}
          trend={overdueTopics.length === 0 ? 'All up to date' : 'Need attention'} color={overdueTopics.length > 0 ? 'text-red-400' : 'text-primary'} delay={0.3}
        />
        <StatCard icon={Trophy} title="Quizzes Taken" value={String(quizHistory.length)}
          trend={`${recentQuizzes.filter(q => (q.attempt_result?.score_pct ?? 0) >= 80).length} high scores`} color="text-[#B9A7FF]" delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 50, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="lg:col-span-2 space-y-8"
        >
          {/* Weak Topics Alert */}
          {weakAreas.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-[24px] p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-black uppercase tracking-widest text-sm text-red-400">Weak Areas — Review Needed</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((topic: string) => (
                  <Link key={topic} to="/quiz"
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] font-black uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Quiz History */}
          <div className="refracted-glass border-highlight rounded-[30px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Quiz History</h2>
              <Link to="/quiz" className="text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2">
                New Quiz <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : recentQuizzes.length === 0 ? (
              <div className="py-10 text-center text-white/30 font-bold uppercase tracking-widest text-xs">
                No quizzes yet — take your first quiz!
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuizzes.map((q, idx) => {
                  const pct = q.attempt_result?.score_pct ?? Math.round((q.attempt_result?.score / q.attempt_result?.total) * 100) ?? 0
                  return (
                    <div key={q.id || idx} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pct >= 80 ? 'bg-primary/20 text-primary' : pct >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{q.topic_name || 'Quiz'}</h4>
                          <p className="text-[10px] font-black uppercase tracking-wider text-white/30">{q.difficulty} · {q.attempt_result?.total ?? '?'} questions</p>
                        </div>
                      </div>
                      <div className={`font-black text-xl italic ${pct >= 80 ? 'text-primary' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {pct}%
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Start Quiz', desc: 'Test your knowledge', icon: Brain, to: '/quiz', color: 'text-primary' },
              { title: 'Upload Material', desc: 'Add new syllabus', icon: BookOpen, to: '/upload', color: 'text-[#B9A7FF]' },
              { title: 'Study Plan', desc: 'View your roadmap', icon: Target, to: '/planner', color: 'text-yellow-400' },
              { title: 'Grade Answer', desc: 'Handwritten grader', icon: Sparkles, to: '/grader', color: 'text-emerald-400' },
            ].map((item) => (
              <Link to={item.to} key={item.title}>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/10 hover:border-primary/30 transition-all group cursor-pointer">
                  <item.icon className={`w-8 h-8 mb-3 ${item.color} group-hover:scale-110 transition-transform`} />
                  <h4 className="font-black text-white uppercase tracking-wider text-sm">{item.title}</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotateY: -20 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="space-y-8"
        >
          {/* Readiness Gauge */}
          <div className="refracted-glass border-highlight rounded-[30px] p-8 text-center flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <motion.circle cx="60" cy="60" r="50" fill="none"
                  stroke={readinessPct >= 80 ? '#00F5D4' : readinessPct >= 50 ? '#fbbf24' : '#f87171'}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="314.16"
                  initial={{ strokeDashoffset: 314.16 }}
                  animate={{ strokeDashoffset: 314.16 * (1 - readinessPct / 100) }}
                  transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black italic text-white">{Math.round(readinessPct)}<span className="text-base text-primary">%</span></div>
                <div className="text-[8px] font-black uppercase tracking-widest text-white/30">Readiness</div>
              </div>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Exam Readiness Score</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              {readiness?.topics_attempted ?? 0} of {readiness?.total_topics ?? '?'} topics attempted
            </p>

            <div className="w-full h-px bg-white/10 my-6" />

            {/* Strong areas */}
            {strongAreas.slice(0, 3).map((t: string) => (
              <div key={t} className="w-full flex items-center gap-2 py-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-white/60 font-bold truncate">{t}</span>
                <span className="ml-auto text-[10px] text-primary font-black">Strong</span>
              </div>
            ))}
          </div>

          {/* Overdue Reviews */}
          {overdueTopics.length > 0 && (
            <div className="bg-[#07070A]/80 border border-red-500/20 rounded-[30px] p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Overdue Reviews
              </h2>
              <div className="space-y-3">
                {overdueTopics.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/70 truncate max-w-[140px]">{item.topic_name}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Overdue</span>
                  </div>
                ))}
              </div>
              <Link to="/quiz" className="block mt-4 text-center text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                Review Now →
              </Link>
            </div>
          )}

          {/* Materials count */}
          <div className="bg-[#07070A]/80 border border-white/10 rounded-[30px] p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Materials Loaded
            </h2>
            <div className="text-4xl font-black italic text-white">{materials.length}</div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Syllabi in Knowledge Base</p>
            <Link to="/upload" className="block mt-4 text-center text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
              Add More →
            </Link>
          </div>
        </motion.div>
      </div>

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
      `}} />
    </div>
  )
}

const StatCard = ({ icon: Icon, title, value, trend, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30, rotateX: -20 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.02, rotateY: 5 }}
    className="refracted-glass border-highlight p-6 rounded-[24px] relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
      <Icon className={`w-24 h-24 ${color}`} />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-white/60">{title}</span>
      </div>
      <div>
        <h3 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{value}</h3>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${color} flex items-center gap-1`}>
          <TrendingUp className="w-3 h-3" /> {trend}
        </p>
      </div>
    </div>
  </motion.div>
)
