import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Calendar, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  PlayCircle, 
  MessageSquare,
  Repeat2,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const DashboardPage = () => {
  const { readinessScore, weakTopics, revisionQueue, currentMaterialId } = useStudyStore()
  const user = useUserStore(state => state.user)

  return (
    <div className="max-w-7xl mx-auto space-y-12">
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
            Welcome back, Agent {profile?.full_name?.split(' ')[0] || 'Unknown'}
          </p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 backdrop-blur-md">
           <button className="px-6 py-2 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(0,245,212,0.3)]">Analytics</button>
           <button className="px-6 py-2 rounded-xl text-white/50 hover:text-white font-black uppercase tracking-widest text-xs transition-colors">History</button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Activity} 
          title="Neural Sync" 
          value="98%" 
          trend="+2% Optimal" 
          color="text-primary" 
          delay={0.1}
        />
        <StatCard 
          icon={Target} 
          title="Active Goals" 
          value="12" 
          trend="3 completed today" 
          color="text-[#B9A7FF]" 
          delay={0.2} 
        />
        <StatCard 
          icon={Clock} 
          title="Deep Work" 
          value="14h" 
          trend="+2h this week" 
          color="text-primary" 
          delay={0.3}
        />
        <StatCard 
          icon={Medal} 
          title="Cognitive Rank" 
          value="Elite" 
          trend="Top 5% of cohort" 
          color="text-[#B9A7FF]" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="lg:col-span-2 space-y-8"
        >
           {/* Active Modules */}
          <div className="refracted-glass border-highlight rounded-[30px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Active Modules</h2>
              <button className="text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2">
                 View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Quantum Mechanics', progress: 75, status: 'In Progress', icon: Brain, color: 'text-primary' },
                { title: 'Linear Algebra', progress: 100, status: 'Mastered', icon: Sparkles, color: 'text-[#B9A7FF]' },
                { title: 'Organic Chemistry', progress: 30, status: 'Pending', icon: BookOpen, color: 'text-white/40' }
              ].map((module, idx) => (
                <div key={idx} className="group relative bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${module.color}`}>
                      <module.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-wider">{module.title}</h4>
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mt-1">{module.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl italic">{module.progress}%</span>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${module.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
           initial={{ opacity: 0, x: 50, rotateY: -20 }}
           animate={{ opacity: 1, x: 0, rotateY: 0 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="space-y-8"
        >
          {/* Performance Radar */}
          <div className="refracted-glass border-highlight rounded-[30px] p-8 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
                <Zap className="w-8 h-8 text-primary drop-shadow-[0_0_15px_#00F5D4]" />
             </div>
             <h3 className="text-5xl font-black italic tracking-tighter text-white mb-2">94<span className="text-xl text-primary">%</span></h3>
             <p className="text-xs font-black uppercase tracking-widest text-white/40">Cognitive Retention Rate</p>
             
             <div className="w-full h-[1px] bg-white/10 my-8" />
             
             <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
                Run Diagnostics
             </button>
          </div>

           {/* Upcoming Goals */}
           <div className="bg-[#07070A]/80 border border-white/10 rounded-[30px] p-8 backdrop-blur-md">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-6 flex items-center gap-2">
               <Target className="w-4 h-4" /> Next Objectives
            </h2>
            <div className="space-y-4">
               {[
                 'Complete Physics Sandbox', 'Review Chapter 4 Nodes', 'Submit Calculus Assignment'
               ].map((goal, i) => (
                  <div key={i} className="flex items-start gap-3">
                     <div className="w-5 h-5 rounded border border-primary/50 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-sm bg-primary/20" />
                     </div>
                     <span className="text-sm font-medium text-white/80">{goal}</span>
                  </div>
               ))}
            </div>
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
  );
};

// Extracted ChevronRight since we used it above
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

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
);
