import { motion } from 'framer-motion'
import { Rocket, Upload, Network, BookOpen, PenTool, Sparkles, CheckCircle, Zap, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Abstract Background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-60" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
            <Sparkles className="w-3 h-3" /> The Future of Learning
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Syllabus → <span className="text-primary italic">AI Study Coach</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your syllabus or handwritten notes. Our AI builds your personalized 
            knowledge map, schedules your reviews, and grades your practice tests.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-lg h-14 px-8 rounded-xl shadow-xl shadow-primary/20 font-bold group">
                Get Started <Rocket className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 rounded-xl border-primary/20 hover:bg-primary/5 font-bold">
                <Upload className="mr-2 w-5 h-5" /> Upload Syllabus
              </Button>
            </Link>
          </div>

        </motion.div>

        {/* Floating Feature Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="max-w-5xl mx-auto mt-20 relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[80px] -z-10 opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="bg-card/50 backdrop-blur-xl border border-primary/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">ai_roadmap_visualizer.v2</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl inline-flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3" /> AI Analysis Complete
                </div>
                <h3 className="text-2xl font-bold">Gauss's Law Mastery</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="opacity-60">Mastery Level</span>
                    <span className="text-primary font-bold">82%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ delay: 1, duration: 2 }} className="h-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "You have a strong grasp of the mathematical formula but struggled with Gaussian surface selection for asymmetrical charges."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Network, label: 'Topic Graph', val: '9 Nodes' },
                  { icon: Sparkles, label: 'AI Tutor', val: 'Active' },
                  { icon: Zap, label: 'Focus Score', val: '92' },
                  { icon: ShieldCheck, label: 'Readiness', val: 'High' },
                ].map((stat, i) => (
                  <div key={i} className="bg-muted/30 border border-border/50 rounded-2xl p-4 text-center group-hover:bg-primary/5 transition-colors">
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary opacity-70" />
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{stat.label}</div>
                    <div className="text-sm font-black">{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Built for Competitive Students</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Skip the generic planning. Let AI build the roadmap based on your actual performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Network, title: 'Knowledge Map', desc: 'See how concepts connect. Our AI extracts dependencies automatically so you never learn out of order.' },
              { icon: BookOpen, title: 'Smart Quizzes', desc: 'AI-generated MCQs that target your weak areas, complete with reasoning chains for every answer.' },
              { icon: PenTool, title: 'Handwritten Grader', desc: 'Upload a photo of your paper answers. Our OCR-AI grades them against model answers instantly.' },
            ].map((f, i) => (
              <Card key={i} className="border-none shadow-none bg-transparent group">
                <CardContent className="p-0 space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote / Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <blockquote className="text-2xl md:text-3xl font-medium italic opacity-80 leading-snug">
            "The AI identified gaps in my Maxwell Equations foundation before I even took the midterm. It's essentially a private tutor that lives in your browser."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted border" />
            <div className="text-left">
              <div className="font-bold">Aravind Sharma</div>
              <div className="text-xs text-muted-foreground">Physics Undergrad, IIT Kanpur</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center space-y-8 bg-primary/5 rounded-[40px] p-12 border border-primary/10">
          <h2 className="text-4xl font-black">Ready to master your syllabus?</h2>
          <Link to="/auth">
            <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20">
             Start Your Journey
            </Button>
          </Link>

        </div>
      </section>

      <footer className="py-12 text-center text-xs text-muted-foreground opacity-60 border-t">
        © 2026 SmartScholar AI. Built for the Code-A-Haunt 3.0 Hackathon.
      </footer>
    </div>
  )
}
